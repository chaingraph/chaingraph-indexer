import { isEqual, uniqBy } from 'lodash'
import omit from 'lodash.omit'
import { config } from '../config'
import {
  deleteTableRows,
  upsertActions,
  upsertBlocks,
  upsertTableRows,
  upsertTransactions,
} from '../database'
import { deleteBlock } from '../database/queries'
import { logger } from '../lib/logger'
import { MappingsReader } from '../mappings'
import { loadReader } from '../reader/ship-reader'
import { ChainGraphAction, ChainGraphTableRow } from '../types'
import { WhitelistReader } from '../whitelist'
import { loadCurrentTableState } from './load-state'
import { getChainGraphTableRowData } from './utils'

const DELPHIORACLE_FOREX_PRICE_UPDATE_INTERVAL = 1 * (60 * (60 * 1000)) // 1hr (60min * (60sec * 1000ms))
const DELPHIORACLE_CRYPTO_PRICE_UPDATE_INTERVAL = 5 * (60 * 1000) // 5min * (60sec * 1000ms)

export const startRealTimeStreaming = async (
  mappingsReader: MappingsReader,
  whitelistReader: WhitelistReader,
) => {
  logger.info('Starting realtime indexing from eosio ship ...')

  const { close$, blocks$, errors$, forks$ } = await loadReader(
    mappingsReader,
    whitelistReader,
  )

  let pendingCommitDelphioracleTableRows: ChainGraphTableRow[] = []
  let completedCommitDelphioracleTableRows: ChainGraphTableRow[] = []

  // we subscribe to eosio ship reader whitelisted block stream and insert the data in postgres thru prisma
  // this stream contains only the blocks that are relevant to the whitelisted contract tables and actions
  blocks$.subscribe(async (block) => {
    try {
      logger.info(
        `Processed block ${block.block_num}. Transactions: ${block.transactions.length}, actions ${block.actions.length}, table rows ${block.table_rows.length} `,
      )

      // insert table_rows and filtering them by unique p_key to avoid duplicates and real-time crash
      const tableRowsDeltas = block.table_rows
        .filter((row) => {
          logger.warn('> The received row =>', { row })
          return (
            row.code !== 'delphioracle' &&
            row.present &&
            Boolean(row.primary_key) &&
            !Boolean(
              row.primary_key.normalize().toLowerCase().includes('undefined'),
            )
          )
        })
        .map((row) => getChainGraphTableRowData(row, mappingsReader))

      const delphioracleRowsDeltas: ChainGraphTableRow[] = block.table_rows
        .filter((row) => {
          return (
            row.code === 'delphioracle' &&
            row.present &&
            Boolean(row.primary_key) &&
            !Boolean(
              row.primary_key.normalize().toLowerCase().includes('undefined'),
            ) &&
            // TODO: configurable env owner filter
            row.value.owner.match(/^(eosiodetroit|criptolions1|ivote4eosusa|eostitanprod|alohaeosprod|teamgreymass)$/)
          )
        })
        .map((row) => {
          // Regulating the ID type
          // This avoid when real-time change historical with the upsert and since ID is a number for historical and a string for real-time, we turn the ID into a number
          const digestedRow = getChainGraphTableRowData({
            ...row,
            value: {
              ...row.value,
              id: parseInt(row.value.id, 10),
            },
          }, mappingsReader)

          return ({
            ...digestedRow,
            // mapping the id to make it unique
            primary_key: `${row.scope}-${row.value?.owner}-${row.value.id}`,
            scope: digestedRow.scope.normalize().replace(/\"/g, ''),
          })
        })

      pendingCommitDelphioracleTableRows = uniqBy(delphioracleRowsDeltas, 'primary_key')
      const filteredLimitDelphioracleBPRows = []
      const upsertPendingRows = []

      if (pendingCommitDelphioracleTableRows.length > 0 && completedCommitDelphioracleTableRows.length > 0) {
        const previousCompletedCommitDelphioracleTableRows = completedCommitDelphioracleTableRows

        completedCommitDelphioracleTableRows = previousCompletedCommitDelphioracleTableRows.map((row) => {
          const pendingCommitRow = pendingCommitDelphioracleTableRows.find(
            (pendingRow) => {
              const pendingForexRowTime = new Date(pendingRow.data.timestamp).getTime() - DELPHIORACLE_FOREX_PRICE_UPDATE_INTERVAL
              const pendingCryptoRowTime = new Date(pendingRow.data.timestamp).getTime() - DELPHIORACLE_CRYPTO_PRICE_UPDATE_INTERVAL
              const rowTime = new Date(row.data.timestamp).getTime()

              return pendingRow.primary_key === row.primary_key &&
                // * this is to avoid the real-time to override the historical data that is already in the database and has same value
                ((pendingForexRowTime > rowTime && pendingRow.scope.match(/^usdt/)) || pendingCryptoRowTime > rowTime) &&
                pendingRow.data.value !== row.data.value
            })

          if (pendingCommitRow) {
            return pendingCommitRow
          }

          return row
        }).sort((a, b) => {
          // * This is to sort the rows by timestamp. Latest first
          const aTime = new Date(a.data.timestamp).getTime()
          const bTime = new Date(b.data.timestamp).getTime()

          return bTime - aTime
        })

        if (!isEqual(completedCommitDelphioracleTableRows, previousCompletedCommitDelphioracleTableRows)) {
          completedCommitDelphioracleTableRows.forEach((row) => {
            const rowBPOwner = row.data.owner

            if (filteredLimitDelphioracleBPRows.filter((filteredRow) => filteredRow.data.owner === rowBPOwner)?.length < 5) {
              filteredLimitDelphioracleBPRows.push(row)
            }
          })
        }

        pendingCommitDelphioracleTableRows = []
      } else if (pendingCommitDelphioracleTableRows.length > 0) {
        completedCommitDelphioracleTableRows = completedCommitDelphioracleTableRows.concat(pendingCommitDelphioracleTableRows)
        completedCommitDelphioracleTableRows.forEach((row) => {
          const rowBPOwner = row.data.owner

          if (filteredLimitDelphioracleBPRows.filter((filteredRow) => filteredRow.data.owner === rowBPOwner)?.length < 5) {
            filteredLimitDelphioracleBPRows.push(row)
          }
        })

        pendingCommitDelphioracleTableRows = []
      }

      upsertPendingRows.push(...filteredLimitDelphioracleBPRows)

      if (tableRowsDeltas.length > 0) {
        // TODO: check if delphioracleRows should be included in the upsertTableRows...
        // ! check if previous upsert is the same as this one
        upsertPendingRows.push(...tableRowsDeltas)
      }

      await upsertTableRows(upsertPendingRows)

      // delete table_rows
      const deleted_table_rows = block.table_rows
        .filter((row) => !row.present)
        .map((row) => getChainGraphTableRowData(row, mappingsReader))

      if (deleted_table_rows.length > 0) {
        await deleteTableRows(deleted_table_rows)
      }

      // delete block data in case of microfork
      deleteBlock(config.reader.chain, block.block_num)

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
          data: JSON.stringify(action.data),
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
      logger.fatal('=> real-time blocks$.subscribe:', error)
      // send message to discord
      process.exit(1)
    }
  })

  close$.subscribe(() => logger.info('connection closed'))
  // log$.subscribe(({ message }: any) => logger.info('ShipReader:', message))
  errors$.subscribe((error) => logger.error('ShipReader:', error))

  forks$.subscribe((block_num) => {
    logger.warn(`Microfork on block number : ${block_num}`)
    // load current state of whitelisted tables,
    loadCurrentTableState(mappingsReader, whitelistReader)
  },
  )
}
