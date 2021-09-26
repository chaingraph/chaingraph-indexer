// ColumnSet for bulk inserts
// https://github.com/vitaly-t/pg-promise/wiki/Data-Imports

import { pgp } from './db'
import {
  ChainGraphAction,
  ChainGraphBlock,
  ChainGraphTableRow,
  ChainGraphTransaction,
} from '../types'

// Table rows
export const tableRowsColumnSet = new pgp.helpers.ColumnSet(
  ['chain', 'contract', 'table', 'scope', 'primary_key', 'data'],
  {
    table: 'table_rows',
  }
)

export const createUpsertTableRowsQuery = (tableRows: ChainGraphTableRow[]) =>
  pgp.helpers.insert(tableRows, tableRowsColumnSet) + ' ON DUPLICATE KEY UPDATE'

//  Transactions
export const transactionsColumnSet = new pgp.helpers.ColumnSet(
  [
    'chain',
    'transaction_id',
    'block_num',
    'cpu_usage_us',
    'net_usage_words',
    'net_usage',
  ],
  {
    table: 'transactions',
  }
)

export const createUpsertTransactionsQuery = (
  transactions: ChainGraphTransaction[]
) =>
  pgp.helpers.insert(transactions, transactionsColumnSet) +
  ' ON DUPLICATE KEY UPDATE'

// Blocks
export const blocksColumnSet = new pgp.helpers.ColumnSet(
  ['chain', 'block_num', 'block_id', 'timestamp', 'producer'],
  {
    table: 'blocks',
  }
)

export const createUpsertBlocksQuery = (blocks: ChainGraphBlock[]) =>
  pgp.helpers.insert(blocks, blocksColumnSet) + ' ON DUPLICATE KEY UPDATE'

// Actions
export const actionsColumnSet = new pgp.helpers.ColumnSet(
  [
    'chain',
    'transaction_id',
    'contract',
    'action',
    'data',
    'authorization',
    'global_sequence',
    'action_ordinal',
    'account_ram_deltas',
    'receipt',
    'context_free',
    'account_disk_deltas',
    'console',
    'receiver',
  ],
  {
    table: 'actions',
  }
)

export const createUpsertActionsQuery = (actions: ChainGraphAction[]) =>
  pgp.helpers.insert(actions, actionsColumnSet) + ' ON DUPLICATE KEY UPDATE'
