// ColumnSet for bulk inserts
// https://github.com/vitaly-t/pg-promise/wiki/Data-Imports

import { pgp } from './db'
import {
  ChainGraphAction,
  ChainGraphBlock,
  ChainGraphTableRow,
  ChainGraphTransaction,
} from '../types'
import { logger } from '../lib/logger'

// Table Rows
export const tableRowsColumnSet = new pgp.helpers.ColumnSet(
  ['chain', 'contract', 'table', 'scope', 'primary_key', 'data'],
  {
    table: 'table_rows',
  },
)

export const createUpsertTableRowsQuery = (tableRows: ChainGraphTableRow[]) =>
  pgp.helpers.insert(tableRows, tableRowsColumnSet) +
  ' ON CONFLICT ON CONSTRAINT table_rows_pkey DO UPDATE SET data=EXCLUDED.data;'

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
  pgp.helpers.insert(transactions, transactionsColumnSet) +
  ' ON CONSTRAINT transactions_pkey DO UPDATE SET block_num=EXCLUDED.block_num,' +
  ' cpu_usage_us=EXCLUDED.cpu_usage_us, net_usage=EXCLUDED.net_usage, net_usage_words=EXCLUDED.net_usage_words;'

// Blocks
export const blocksColumnSet = new pgp.helpers.ColumnSet(
  ['chain', 'block_num', 'block_id', 'timestamp', 'producer'],
  {
    table: 'blocks',
  },
)

export const createUpsertBlocksQuery = (blocks: ChainGraphBlock[]) =>
  pgp.helpers.insert(blocks, blocksColumnSet) +
  ' ON CONFLICT ON CONSTRAINT blocks_pkey DO UPDATE SET block_id=EXCLUDED.block_id, timestamp=EXCLUDED.timestamp, producer=EXCLUDED.producer;'

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
  },
)

export const createUpsertActionsQuery = (actions: ChainGraphAction[]) =>
  pgp.helpers.insert(actions, actionsColumnSet) +
  ' ON CONSTRAINT actions_pkey DO UPDATE SET data=EXCLUDED.data,' +
  ' authorization=EXCLUDED.authorization, global_sequence=EXCLUDED.global_sequence, action_cardinal=EXCLUDED.action_cardinal' +
  ' account_ram_deltas=EXCLUDED.account_ram_deltas, receipt=EXCLUDED.receipt, context_free=EXCLUDED.context_free' +
  ' account_disk_deltas=EXCLUDED.account_disk_deltas, console=EXCLUDED.console, receiver=EXCLUDED.receiver'

export const createDeleteTableRowsQuery = (
  table_rows: ChainGraphTableRow[],
) => {
  const list = table_rows.reduce(
    (list, { chain, contract, scope, primary_key, table }) =>
      `${list}('${chain}','${contract}','${scope}','${table}','${primary_key}')`,
    '',
  )
  const query = pgp.as.format(
    `DELETE * FROM table_rows WHERE (chain, contract, scope, table, primary_key) IN (${list})`,
  )
  logger.info(query)
  return query
}
