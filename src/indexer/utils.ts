import { EosioReaderTableRow } from '@blockmatic/eosio-ship-reader'
import omit from 'lodash.omit'
import { config } from '../config'
import { logger } from '../lib/logger'
import { MappingsReader } from '../mappings'
import { ChainGraphTableRow } from '../types'

export const getPrimaryKey = (
  row: EosioReaderTableRow,
  mappingsReader: MappingsReader,
): string => {
  let tableMappings
  try {
    // find table mappings
    tableMappings = mappingsReader.mappings
      .find((m) => m.contract === row.code)
      .tables.find((t) => t.table === row.table)

    if (!tableMappings) {
      throw new Error(`TableMapping not found for row ${JSON.stringify(row)}`)
    }

    if (tableMappings.table_type === 'singleton') return 'singleton'

    let primary_key
    if (tableMappings.computed_key_type === 'asset_symbol') {
      primary_key = row.value[tableMappings.table_key].split(' ')[1]
    } else if (tableMappings.computed_key_type === 'symbol') {
      primary_key = row.value[tableMappings.table_key].split(',')[1]
    } else {
      primary_key = row.value[tableMappings.table_key]
    }
    return '' + primary_key
  } catch (error) {
    logger.warn({ row, tableMappings })
    if (error instanceof Error) logger.error(error)
    process.exit(1)
  }
}

export const getChainGraphTableRowData = (
  row: EosioReaderTableRow,
  mappingsReader: MappingsReader,
): ChainGraphTableRow => {
  return {
    primary_key: getPrimaryKey(row, mappingsReader).toString(),
    ...omit(row, 'value', 'code', 'present', 'primary_key'),
    data: row.value,
    contract: row.code,
    chain: config.reader.chain,
  }
}
