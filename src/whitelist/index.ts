import {
  EosioReaderActionFilter,
  EosioReaderTableRowFilter,
} from '@blockmatic/eosio-ship-reader'
import { db } from '../lib/prisma'
import { log } from '../lib/logger'

// this state keeps updated every .1s through polling
let _chaingraph_table_registry: ChainGraphTableRegistry[] = []
let _actions_whitelist: EosioReaderActionFilter[] = []
let _table_rows_whitelist: EosioReaderTableRowFilter[] = []
let _token_list: Array<string> = []

const get_chaingraph_table_registry = () => _chaingraph_table_registry
const get_actions_whitelist = () => _actions_whitelist
const get_table_rows_whitelist = () => _table_rows_whitelist
const get_token_list = () => _token_list

export interface WhitelistReader {
  get_chaingraph_table_registry: () => ChainGraphTableRegistry[]
  get_table_rows_whitelist: () => EosioReaderTableRowFilter[]
  get_actions_whitelist: () => EosioReaderActionFilter[]
  get_token_list: () => Array<string>
}

const updateIndexingMappings = (contractMappings: mappings[]) => {
  log.info('Updating contract mappings in memory ...')
  try {
    const table_registry: ChainGraphTableRegistry[] = []
    const token_registry: TokenRegistry[] = []
    const table_rows_whitelist: EosioReaderTableRowFilter[] = []
    const actions_registry: EosioReaderActionFilter[] = []

    contractMappings.forEach(({ mapping, contract_name }) => {
      // workaround type issue
      const mapDef: any = mapping

      // push actions to actions registry
      const actions = mapDef.actions
      if (actions) {
        actions_registry.push({
          code: contract_name,
          action: actions,
        })
      }

      // push contract name to token list
      const type = mapDef.type
      if (type) token_list.push(contract_name)

      // push contract table to tables registry
      mapDef.table_registry.forEach((registry: any) => {
        const code = contract_name
        if (type) {
          token_registry.push({
            code,
            table: registry.table,
            table_key: registry.table_key,
          })
        }
        table_rows_whitelist.push({
          code,
          scope: registry.scope,
          table: registry.table,
        })
        table_registry.push({
          code,
          scope: registry.scope,
          table: registry.table,
          lower_bound: registry.lower_bound,
          upper_bound: registry.upper_bound,
          table_key: registry.table_key,
        })
      })
    })
    // update memory state[
    ;[
      _chaingraph_table_registry,
      _chaingraph_token_registry,
      _table_rows_whitelist,
      _actions_whitelist,
      _token_list,
    ] = [
      table_registry,
      token_registry,
      table_rows_whitelist,
      actions_registry,
      token_list,
    ]
  } catch (error) {
    log.error('Error updating contract mappings', error)
  }
}

const subscribe = () => {
  log.info('Subscribing to contract mappings ...')
  setInterval(async () => {
    try {
      const whitelists = await db.whitelists.findMany()
      updateIndexingMappings(whitelists)
    } catch (error) {
      log.error('Error updating contract mappings', error)
    }
  }, 1000)
}

export const initWhiteList = async () => {
  subscribe()

  return {
    get_chaingraph_table_registry,
    get_chaingraph_token_registry,
    get_table_rows_whitelist,
    get_actions_whitelist,
    get_token_list,
  } as WhitelistReader
}
