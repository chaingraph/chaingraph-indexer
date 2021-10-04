import { logger } from '../lib/logger'
import { rpc } from '../lib/eosio'
import { getChainGraphTableRowData } from './utils'
import { MappingsReader } from '../mappings'
import { WhitelistReader } from '../whitelist'
import { ChainGraphTableWhitelist } from '../types'
import { api } from '../lib/eosio-core'

const getTableScopes = async (code: string, table: string) => {
  logger.info(`getTableScopes for ${code} table ${table}`)
  const params = {
    code,
    table,
    limit: 1000,
  }

  const response = await rpc.get_table_by_scope(params)
  logger.info(response)
  const core_scopes = await api.v1.chain.get_table_by_scope(params)
  const scopes = response.rows.map(({ scope }) => scope)
  logger.info({ scopes, core_scopes })
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

      logger.info(JSON.stringify(tables, null, 2))
      tables.forEach(({ table, scopes }) => {
        // get all table rows acrross all scope flat them out on allRows array
        // const allRows = (
        //   await Promise.all(
        //     scopes.map(async ({ scope }: { scope: string }) => {
        //       const { rows } = await rpc.get_table_rows({
        //         ...entry,
        //         scope,
        //         limit: 1000000,
        //       })
        //       return rows.map((row) => {
        //         return getChainGraphTableRowData(
        //           {
        //             primary_key: '0',
        //             present: '2',
        //             code: entry.contrac
        //             scope,
        //             value: row,
        //           },
        //           mappingsReader,
        //         )
        //       })
        //     }),
        //   )
        // ).flat()
        // // upsert all table rows on the database
        // await hasura.query.upsert_table_rows({ objects: allRows })
        // logger.info(
        //   `State for ${JSON.stringify(
        //     omit(entry, 'table_key'),
        //   )} succesfully loaded!`,
        // )
      })
    },
  )
}
