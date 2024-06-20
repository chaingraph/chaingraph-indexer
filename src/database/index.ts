import {
  ChainGraphAction,
  ChainGraphBlock,
  ChainGraphTableRow,
  ChainGraphTransaction,
} from '../types'
import { db } from './db'
import {
  createDeleteTableRowsQuery,
  createUpsertActionsQuery,
  createUpsertBlocksQuery,
  createUpsertTableRowsQuery,
  createUpsertTransactionsQuery,
} from './queries'

export * from './db'

const runQuery = async (query: string) => {
  // logger.info(query)
  return db.none(query)
}

export const upsertBlocks = async (blocks: ChainGraphBlock[]) => {
  if (!blocks.length) return Promise.resolve()
  return runQuery(createUpsertBlocksQuery(blocks))
}

export const upsertTableRows = async (tableRows: ChainGraphTableRow[]) => {
  // console.log('upsertTableRows', tableRows)
  if (!tableRows.length) return Promise.resolve()
  return runQuery(createUpsertTableRowsQuery(tableRows))
}

export const deleteTableRows = async (tableRows: ChainGraphTableRow[]) => {
  if (!tableRows.length) return Promise.resolve()
  return runQuery(createDeleteTableRowsQuery(tableRows))
}

export const upsertTransactions = async (
  transactions: ChainGraphTransaction[],
) => {
  if (!transactions.length) return Promise.resolve()
  return runQuery(createUpsertTransactionsQuery(transactions))
}

export const upsertActions = async (actions: ChainGraphAction[]) => {
  // console.log('upsertActions', actions)
  if (!actions.length) return Promise.resolve()
  return runQuery(createUpsertActionsQuery(actions))
}