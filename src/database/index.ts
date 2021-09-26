import { logger } from '../lib/logger'
import { db } from './db'
import {
  createUpsertActionsQuery,
  createUpsertBlocksQuery,
  createUpsertTableRowsQuery,
  createUpsertTransactionsQuery,
} from './queries'
import {
  ChainGraphAction,
  ChainGraphBlock,
  ChainGraphTableRow,
  ChainGraphTransaction,
} from '../types'

export * from './db'
export * from '../types'

const runQuery = async (query: string) => {
  logger.info(query)
  return db.many(query)
}

export const upsertBlocks = async (blocks: ChainGraphBlock[]) =>
  runQuery(createUpsertBlocksQuery(blocks))

export const upsertTableRows = async (tableRows: ChainGraphTableRow[]) =>
  runQuery(createUpsertTableRowsQuery(tableRows))

export const deleteTableRows = async (tableRows: ChainGraphTableRow[]) =>
  logger.info(tableRows)

export const upsertTransactions = async (
  transactions: ChainGraphTransaction[]
) => runQuery(createUpsertTransactionsQuery(transactions))

export const upsertActions = async (actions: ChainGraphAction[]) =>
  runQuery(createUpsertActionsQuery(actions))
