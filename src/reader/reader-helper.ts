import {
  EosioReaderAbisMap,
  EosioReaderActionFilter,
  EosioReaderTableRowFilter,
  ShipTableDeltaName,
} from '@blockmatic/eosio-ship-reader'
import { fecthAbi } from '../lib/eosio'
import { MappingsReader } from '../mappings'
import {
  ChainGraphActionWhitelist,
  ChainGraphContractWhitelist,
  ChainGraphTableWhitelist,
} from '../types'
import { createWhitelistReader } from '../whitelist'

export interface ReaderHelper {
  delta_whitelist: () => ShipTableDeltaName[]
  contract_abis: () => EosioReaderAbisMap
  table_rows_whitelist: () => EosioReaderTableRowFilter[]
  actions_whitelist: () => EosioReaderActionFilter[]
}

// eosio-ship-reader expects callback functions for retrieving filtering whitelists
// this pattern allow us to update the whitelist without stopping the reader
// this helper subscribes to the contract mappings subject and load abis in memory for ship reader to consume
export const createShipReaderDataHelper = async (
  mappingsReader: MappingsReader,
): Promise<ReaderHelper> => {
  const { whitelist$, whitelist } = await createWhitelistReader()

  // in memory fitlers and abis
  let tableRowsFilters: EosioReaderTableRowFilter[] | null = null
  let actionsFilters: EosioReaderActionFilter[] | null = null
  let abis: EosioReaderAbisMap | null = null

  // ship filter have a different format than ChainGraph mappings
  // this function massages the data for eosio-ship-reader to consume
  // eosio-ship-reader will support the chaingraph protocol, this is temporary
  // we should supoort actions: *, tables: * on the yml
  const updateShipFilters = (whitelist: ChainGraphContractWhitelist[]) => {
    actionsFilters = whitelist
      .map(({ contract: code, actions }) => {
        // handle wildcard
        if (actions[0] === '*') return [{ code, action: '*' }]

        return (actions as ChainGraphActionWhitelist[]).map(({ action }) => {
          return {
            code,
            action,
          }
        })
      })
      .flat()

    tableRowsFilters = whitelist
      .map(({ contract: code, tables }) => {
        // handle wildcard
        if (tables[0] === '*') {
          const contractMappings = mappingsReader.mappings.find((m) => {
            return m.contract === code
          })

          return contractMappings.tables.map(({ table }) => ({ code, table }))
        }

        return (tables as ChainGraphTableWhitelist[])
          .map(({ table, scopes }) => {
            if (!scopes || scopes === ['*']) return [{ code, table }]
            return scopes.map((scope) => ({ code, table, scope }))
          })
          .flat()
      })
      .flat()
  }

  // create in-memory filter for ship and subscribe to mappings to keep ship filter in sync
  updateShipFilters(whitelist)
  whitelist$.subscribe(updateShipFilters)

  // load abis in memory
  // TODO: load abis to db when contracts are listed, and keep in sync with then chain, listed to set abi actions.
  abis = new Map()
  const contracts = whitelist.map(({ contract }) => contract)
  const abisArr = await Promise.all(contracts.map((c) => fecthAbi(c)))
  abisArr.forEach(({ account_name, abi }) => abis.set(account_name, abi))

  // return latest abis in memory
  const contract_abis = () => abis

  // return static list, this doesnt change
  const delta_whitelist = () =>
    [
      'contract_table',
      'contract_row',
      'contract_index64',
    ] as ShipTableDeltaName[]

  // return in memory filters
  const table_rows_whitelist = () => tableRowsFilters
  const actions_whitelist = () => actionsFilters

  // Wait until results have been loaded to memory
  await abis
  await actionsFilters
  await tableRowsFilters

  return {
    delta_whitelist,
    contract_abis,
    table_rows_whitelist,
    actions_whitelist,
  }
}
