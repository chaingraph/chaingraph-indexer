import { loadReader } from '../reader/ship-reader'
import omit from 'lodash.omit'
import { logger } from '../lib/logger'
import { getChainGraphTableRowData } from './utils'
import { MappingsReader } from '../mappings'
import {
  deleteTableRows,
  upsertActions,
  upsertBlocks,
  upsertTableRows,
  upsertTransactions,
} from '../database'
import { ChainGraphAction } from '../types'
import { config } from '../config'

export const startRealTimeStreaming = async (
  mappingsReader: MappingsReader,
) => {
  logger.info('Starting realtime indexing from eosio ship ...')

  const { close$, blocks$, errors$, forks$ } = await loadReader(mappingsReader)

  // we subscribe to eosio ship reader whitelisted block stream and insert the data in postgres thru prisma
  // this stream contains only the blocks that are relevant to the whitelisted contract tables and actions
  blocks$.subscribe(async (block) => {
    try {
      logger.info(
        `Processed block ${block.block_num}. Transactions: ${block.transactions.length}, actions ${block.actions.length}, table rows ${block.table_rows.length} `,
      )

      // insert table_rows
      const tableRowsDeltas = block.table_rows
        .filter((row) => {
          logger.warn({ row })
          return row.present
        })
        .map((row) => getChainGraphTableRowData(row, mappingsReader))

      if (tableRowsDeltas.length > 0) upsertTableRows(tableRowsDeltas)

      // delete table_rows
      const deletedTableRows = block.table_rows
        .filter((row) => !row.present)
        .map((row) => getChainGraphTableRowData(row, mappingsReader))

      if (deletedTableRows.length > 0) deleteTableRows(deletedTableRows)

      // insert block data
      await upsertBlocks([
        {
          chain: config.reader.chain,
          ...omit(block, ['actions', 'table_rows', 'transactions', 'chain_id']),
        },
      ])

      // insert transaction data
      const transactions = block.transactions.map((trx) => ({
        ...trx,
        chain: config.reader.chain,
        block_num: block.block_num,
      }))

      // if there are transactions index them along with the actions
      if (transactions.length > 0) {
        await upsertTransactions(transactions)

        // insert action traces
        const actions: ChainGraphAction[] = block.actions.map((action) => {
          // logger.warn('Authorization', typeof action.authorization)
          logger.warn('Action Struct', action)
          return {
            ...omit(action, 'account', 'name', 'elapsed', 'return_value'),
            contract: action.account,
            action: action.name,
            chain: config.reader.chain,
            receiver: '',
          }
        })
        if (actions.length > 0) await upsertActions(actions)
      }
    } catch (error) {
      logger.fatal(error)
      process.exit(1)
    }
  })

  close$.subscribe(() => logger.info('connection closed'))
  // log$.subscribe(({ message }: any) => logger.info('ShipReader:', message))
  errors$.subscribe((error) => logger.error('ShipReader:', error))

  forks$.subscribe((block_num) =>
    logger.warn(`Microfork on block number : ${block_num}`),
  )
}
