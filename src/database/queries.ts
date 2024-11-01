// ColumnSet for bulk inserts
// https://github.com/vitaly-t/pg-promise/wiki/Data-Imports

import {
  ChainGraphAction,
  ChainGraphBlock,
  ChainGraphTableRow,
  ChainGraphTransaction,
} from '../types'
import { pgp } from './db'

// Table Rows
export const tableRowsColumnSet = new pgp.helpers.ColumnSet(
  ['chain', 'contract', 'table', 'scope', 'primary_key', 'data'],
  {
    table: 'table_rows',
  },
)

export const createUpsertTableRowsQuery = (tableRows: ChainGraphTableRow[]) =>
  `${pgp.helpers.insert(
    tableRows,
    tableRowsColumnSet,
  )} ON CONFLICT ON CONSTRAINT tables_pkey DO UPDATE SET data=EXCLUDED.data;`

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
  },
)

export const createUpsertTransactionsQuery = (
  transactions: ChainGraphTransaction[],
) =>
  `${pgp.helpers.insert(
    transactions,
    transactionsColumnSet,
  )} ON CONFLICT ON CONSTRAINT transactions_pkey DO NOTHING`

// Blocks
export const blocksColumnSet = new pgp.helpers.ColumnSet(
  ['chain', 'block_num', 'block_id', 'timestamp', 'producer'],
  {
    table: 'blocks',
  },
)

// TODO: At some point, when we upsertBlocks for real-time data, it throws duplicate key value violates unique constraint "blocks_block_id_key"
export const createUpsertBlocksQuery = (blocks: ChainGraphBlock[]) =>
  `${pgp.helpers.insert(
    blocks,
    blocksColumnSet,
  )} ON CONFLICT ON CONSTRAINT blocks_pkey DO NOTHING`

// Actions
// https://github.com/vitaly-t/pg-promise/issues/809
export const actionsColumnSet = new pgp.helpers.ColumnSet<ChainGraphAction>(
  [
    'chain',
    'transaction_id',
    'contract',
    'action',
    'data',
    'authorization:json',
    'global_sequence',
    'action_ordinal',
    'account_ram_deltas:json',
    'receipt',
    'context_free',
    'account_disk_deltas:json',
    'console',
    'receiver',
  ],
  {
    table: 'actions',
  },
)

export const createUpsertActionsQuery = (actions: ChainGraphAction[]) =>
  `${pgp.helpers.insert(
    actions,
    actionsColumnSet,
  )} ON CONFLICT ON CONSTRAINT actions_pkey DO NOTHING`

export const createDeleteTableRowsQuery = (
  table_rows: ChainGraphTableRow[],
) => {
  const list = table_rows.reduce(
    (list, { chain, contract, scope, primary_key, table }) =>
      `${
        list ? `${list} ,` : ''
      } ('${chain}','${contract}','${scope}','${table}','${primary_key}')`,
    '',
  )
  const query = pgp.as.format(
    `DELETE FROM table_rows WHERE (chain, contract, scope, table_rows.table, primary_key) IN (${list});`,
  )
  return query
}

export const deleteBlock = (chain: string, block_num: number) => {
  const query = pgp.as.format(
    'DELETE FROM blocks WHERE chain = $1 AND block_num = $2',
    [chain, block_num],
  )
  return query
}
