import { logger } from '../lib/logger'
import { rpc } from '../lib/eosio'
import { getChainGraphTableRowData } from './utils'
import omit from 'lodash.omit'
import { MappingsReader } from '../mappings'

export const loadCurrentTableState = async (mappingReader: MappingsReader) => {
  logger.info('Loading current table state ...')

  // get the contract registry
  // const registry = mappingReader.get_chaingraph_table_registry()

  // for each table in registry get all of its data ( all scopes and rows ) and pushed it to the database
  // registry.forEach(async (entry) => {
  //   // load all scopes for the table
  //   let scopes

  //   if (entry.scope) {
  //     scopes = [{ scope: entry.scope }]
  //   } else {
  //     scopes = (
  //       await rpc.get_table_by_scope({
  //         code: entry.code,
  //         table: entry.table,
  //         limit: 1000000,
  //       })
  //     ).rows
  //   }

  //   // get all table rows acrross all scope flat them out on allRows array
  //   const allRows = (
  //     await Promise.all(
  //       scopes.map(async ({ scope }: { scope: string }) => {
  //         const { rows } = await rpc.get_table_rows({
  //           ...entry,
  //           scope,
  //           limit: 1000000,
  //         })
  //         return rows.map((row) => {
  //           return getChainGraphTableRowData(
  //             {
  //               value: row,
  //               present: 'true',
  //               ...omit(
  //                 entry,
  //                 'table_key',
  //                 'scope',
  //                 'lower_bound',
  //                 'upper_bound',
  //               ),
  //               scope,
  //               primary_key: '', // this doesn matter here
  //             },
  //             mappingReader,
  //           )
  //         })
  //       }),
  //     )
  //   ).flat()

  //   // upsert all table rows on the database
  //   await hasura.query.upsert_table_rows({ objects: allRows })

  //   logger.info(
  //     `State for ${JSON.stringify(
  //       omit(entry, 'table_key'),
  //     )} succesfully loaded!`,
  //   )
  // })
}
