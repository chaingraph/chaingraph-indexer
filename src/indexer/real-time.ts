import { loadReader } from '../reader/ship-reader'
import omit from 'lodash.omit'
import { logger } from '../lib/logger'
import { getChainGraphTableRowData } from './utils'
import { MappingsReader } from '../mappings'
import { deleteTableRows, upsertBlocks, upsertTableRows } from '../database'

export const startRealTimeStreaming = async (
  mappingsReader: MappingsReader,
) => {
  logger.info('Starting realtime indexing from eosio ship ...')

  const { close$, blocks$, errors$ } = await loadReader(mappingsReader)

  // we subscribe to eosio ship reader whitelisted block stream and insert the data in postgres thru prisma
  // this stream contains only the blocks that are relevant to the whitelisted contract tables and actions
  blocks$.subscribe(async (block) => {
    try {
      logger.info(
        `Processed block ${block.block_num}. Transactions: ${block.transactions.length}, actions ${block.actions.length}, table rows ${block.table_rows.length} `,
      )

      // insert table_rows
      const tableRowsDeltas = block.table_rows
        .filter((row) => row.present)
        .map((row) => getChainGraphTableRowData(row, mappingsReader))

      upsertTableRows(tableRowsDeltas)

      // delete table_rows
      const deletedTableRows = block.table_rows
        .filter((row) => !row.present)
        .map((row) => getChainGraphTableRowData(row, mappingsReader))

      deleteTableRows(deletedTableRows)

      // insert block data
      await upsertBlocks([
        {
          chain: 'eos',
          ...omit(block, ['actions', 'table_rows', 'transactions', 'chain_id']),
        },
      ])

      // // insert transaction data
      // const transactions = block.transactions.map((trx) => ({
      //   ...trx,
      //   chain: 'eos',
      //   block_num: block.block_num,
      // }))

      // // if there are transactions index them along with the actions
      // if (transactions.length > 0) {
      //   await upsertTransactions(transactions)

      //   // insert action traces
      //   const actions: ChainGraphAction[] = block.actions.map((action) => ({
      //     ...omit(action, 'account', 'name', 'elapsed', 'return_value'),
      //     contract: action.account,
      //     action: action.name,
      //     chain: 'eos',
      //     receiver: '',
      //   }))
      //   if (actions.length > 0) await upsertActions(actions)
      // }
    } catch (error) {
      logger.fatal(error)
      process.exit(1)
    }
  })

  close$.subscribe(() => logger.info('connection closed'))
  // log$.subscribe(({ message }: any) => logger.info('ShipReader:', message))
  errors$.subscribe((error) => logger.error('ShipReader:', error))
}
