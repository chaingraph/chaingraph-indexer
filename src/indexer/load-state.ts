import { logger } from '../lib/logger'
import { rpc } from '../lib/eosio'
import { getChainGraphTableRowData } from './utils'
import { MappingsReader } from '../mappings'
import { WhitelistReader } from '../whitelist'
import { ChainGraphTableWhitelist } from '../types'
import { upsertTableRows } from '../database'

const getTableScopes = async (code: string, table: string) => {
  logger.info(`getTableScopes for ${code} table ${table}`)
  const params = {
    code,
    table,
    limit: 1000,
  }

  const response = await rpc.get_table_by_scope(params)
  // logger.info(`scopes for ${code} ${table}`, response.rows)
  const scopes = response.rows.map(({ scope }) => scope)
  return scopes
}

export const loadCurrentTableState = async (
  mappingsReader: MappingsReader,
  whitelistReader: WhitelistReader,
) => {
  logger.info('Loading current table state ...')

  //for each table in registry get all of its data ( all scopes and rows ) and pushed it to the database
  whitelistReader.whitelist.forEach(
    async ({ contract, tables: tablesFilter }) => {
      // TODO: if eosio.token skip for now
      if (contract === 'eosio.token') return
      // logger.info('Preparing', { contract, tablesFilter })
      let tables: ChainGraphTableWhitelist[] = []
      if (tablesFilter[0] === '*') {
        // get all table names from mappings
        const table_names = mappingsReader.mappings
          .find((m) => m.contract === contract)
          .tables.map((t) => t.table)
        tables = await Promise.all(
          table_names.map(async (table) => ({
            table,
            scopes: await getTableScopes(contract, table),
          })),
        )
      } else {
        tables = await Promise.all(
          tablesFilter.map(async (filter) => {
            if (filter.scopes[0] === '*') {
              logger.info('Wildcard in scopes!')
              return {
                table: filter.table,
                scopes: await getTableScopes(contract, filter.table),
              }
            } else {
              return filter
            }
          }),
        )
      }

      // logger.info(contract, JSON.stringify(tables, null, 2))
      tables.forEach(async ({ table, scopes }) => {
        // if scopes is emtpy here it means there's no data to load
        if (scopes.length === 0) return
        // tables rows requests for this table
        const tableRowsRequests = scopes.map(async (scope) => {
          const { rows } = await rpc.get_table_rows({
            code: contract,
            scope,
            table,
            limit: 1000000,
          })
          // for each row get the right format for ChainGraph
          return rows.map((row) =>
            getChainGraphTableRowData(
              {
                primary_key: '0', // also fixed cos getChainGraphTableRowData determines the real primary_key value
                present: '2', // fixed cos it always exist, it will never be a deletion
                code: contract,
                table,
                scope,
                value: row,
              },
              mappingsReader,
            ),
          )
        })

        // get all table rows acrross all scope flat them out on allRows array
        const allRows = (await Promise.all(tableRowsRequests)).flat()
        // upsert all table rows on the database
        await upsertTableRows(allRows)
        logger.info(`Loaded state for ${JSON.stringify(allRows)}!`)
      })
    },
  )
}
