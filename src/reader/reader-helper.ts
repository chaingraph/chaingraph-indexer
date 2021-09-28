import {
  EosioReaderAbisMap,
  EosioReaderActionFilter,
  EosioReaderTableRowFilter,
  ShipTableDeltaName,
} from '@blockmatic/eosio-ship-reader'
import { fecthAbi } from '../lib/eosio'
import { ChainGraphContractWhitelist } from '../types'
import { createWhitelistReader } from '../whitelist'

// eosio-ship-reader expects callback functions for retrieving filtering whitelists
// this pattern allow us to update the whitelist without stopping the reader
// this helper subscribes to the contract mappings subject and load abis in memory for ship reader to consume
export const createShipReaderDataHelper = async () => {
  const { whitelist$, whitelist } = createWhitelistReader()
  // in memory fitlers
  let tableRowsFilters: EosioReaderTableRowFilter[] = []
  let actionsFilters: EosioReaderActionFilter[] = []

  // ship filter have a different format than ChainGraph mappings
  // this function massages the data for eosio-ship-reader to consume
  const updateShipFilters = (whitelist: ChainGraphContractWhitelist[]) => {
    actionsFilters = whitelist
      .map(({ contract, actions }) => {
        const code = contract
        if (actions[0].action === '*') return [{ code, action: '*' }]

        return actions.map(({ action }) => ({
          code,
          action,
        }))
      })
      .flat()

    tableRowsFilters = whitelist
      .map(({ contract, tables }) => {
        return tables
          .map(({ table, scopes }) => {
            const code = contract
            if (!scopes || scopes[0] === '*') return [{ code, table }]
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
  const abis: EosioReaderAbisMap = new Map()
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

  return {
    delta_whitelist,
    contract_abis,
    table_rows_whitelist,
    actions_whitelist,
  }
}
