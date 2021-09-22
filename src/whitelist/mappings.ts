import { WhitelistReader } from '.'
import { EosioReaderTableRow } from '@blockmatic/eosio-ship-reader'
import omit from 'lodash.omit'

export const getTableRegistry = (
  row: EosioReaderTableRow,
  whitelistReader: WhitelistReader,
) => {
  const table_registry = whitelistReader
    .get_chaingraph_table_registry()
    .find(({ code, scope, table }) => {
      return (
        code === row.code &&
        (scope ? scope === row.scope : true) &&
        table === row.table
      )
    })
  if (!table_registry) {
    throw new Error('No table registry found, something is not right')
  }
  return table_registry
}

export const getPrimaryKey = (
  row: EosioReaderTableRow,
  whitelistReader: WhitelistReader,
) => {
  const table_registry = getTableRegistry(row, whitelistReader)

  let primary_key: string

  switch (table_registry.table_key) {
    case 'singleton':
      primary_key = 'singleton'
      break

    case 'standard_token':
      primary_key = row.value.balance.split(' ')[1]
      break

    default:
      if (table_registry.computed_key_type === 'asset_symbol') {
        primary_key = row.value[table_registry.table_key].split(' ')[1]
      } else if (table_registry.computed_key_type === 'symbol') {
        primary_key = row.value[table_registry.table_key].split(',')[1]
      } else {
        primary_key = row.value[table_registry.table_key]
      }
      break
  }

  return primary_key
}

export const getChainGraphTableRowData = (
  row: EosioReaderTableRow,
  whitelistReader: WhitelistReader,
) => {
  return {
    primary_key: getPrimaryKey(row, whitelistReader).toString(),
    ...omit(row, 'value', 'code', 'present', 'primary_key'),
    data: row.value,
    contract: row.code,
    chain: 'eos',
  }
}