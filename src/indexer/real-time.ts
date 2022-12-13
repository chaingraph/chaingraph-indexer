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
import { deleteBlock } from '../database/queries'
import { WhitelistReader } from '../whitelist'

export const startRealTimeStreaming = async (
  mappings_reader: MappingsReader,
  whitelist_reader: WhitelistReader,
) => {
  logger.info('Starting realtime indexing from eosio ship ...')

  const { close$, blocks$, errors$, forks$ } = await loadReader(
    mappings_reader,
    whitelist_reader,
  )

  // we subscribe to eosio ship reader whitelisted block stream and insert the data in postgres thru prisma
  // this stream contains only the blocks that are relevant to the whitelisted contract tables and actions
  blocks$.subscribe(async (block) => {
    try {
      logger.info(
        `Processed block ${block.block_num}. Transactions: ${block.transactions.length}, actions ${block.actions.length}, table rows ${block.table_rows.length} `,
      )

      // insert table_rows
      const table_rows_deltas = block.table_rows
        .filter((row) => {
          logger.warn({ row })
          return row.present
        })
        .map((row) => getChainGraphTableRowData(row, mappings_reader))
        .filter((row) => row.primary_key && row.primary_key !== 'undefined')

      if (table_rows_deltas.length > 0) upsertTableRows(table_rows_deltas)

      // delete table_rows
      const deleted_table_rows = block.table_rows
        .filter((row) => !row.present)
        .map((row) => getChainGraphTableRowData(row, mappings_reader))

      if (deleted_table_rows.length > 0) deleteTableRows(deleted_table_rows)

      // delete block data in case of microfork
      await deleteBlock(config.reader.chain, block.block_num)

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
        const actions: ChainGraphAction[] = block.actions.map((action) => ({
          chain: config.reader.chain,
          transaction_id: action.transaction_id,
          contract: action.account,
          action: action.name,
          data: action.data,
          authorization: action.authorization,
          global_sequence: action.global_sequence,
          action_ordinal: action.action_ordinal,
          account_ram_deltas: action.account_ram_deltas,
          receipt: action.receipt,
          context_free: action.context_free,
          account_disk_deltas: action.account_disk_deltas,
          console: action.console,
          receiver: '', // TODO : review this
        }))

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
