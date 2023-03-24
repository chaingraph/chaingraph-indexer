import { logger } from '../lib/logger'
import { db } from './db'
import {
  createDeleteTableRowsQuery,
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

const runQuery = async (query: string) => {
  logger.info(query)
  return db.none(query)
}

export const upsertBlocks = async (blocks: ChainGraphBlock[]) =>
  runQuery(createUpsertBlocksQuery(blocks))

export const upsertTableRows = async (tableRows: ChainGraphTableRow[]) =>{
  console.log('upsertTableRows', tableRows)
  runQuery(createUpsertTableRowsQuery(tableRows))}

export const deleteTableRows = async (tableRows: ChainGraphTableRow[]) =>
  runQuery(createDeleteTableRowsQuery(tableRows))

export const upsertTransactions = async (
  transactions: ChainGraphTransaction[],
) => runQuery(createUpsertTransactionsQuery(transactions))

export const upsertActions = async (actions: ChainGraphAction[]) =>{
  console.log('upsertActions', actions)
  runQuery(createUpsertActionsQuery(actions))
}