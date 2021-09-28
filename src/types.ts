export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export type JSONObject = { [member: string]: JSONValue }
export type JSONArray = Array<JSONValue>

export interface ChainGraphTransaction {
  chain: string
  transaction_id: string
  block_num: number
  cpu_usage_us: number | null
  net_usage_words: number | null
  net_usage: number | null
}

export interface ChainGraphTableRow {
  chain: string
  contract: string
  table: string
  scope: string
  primary_key: string
  data: JSONValue
}

export interface ChainGraphChain {
  chain_name: string
  chain_id: string
  rpc_endpoint: string
}

export interface ChainGraphApiUser {
  account: string
  api_key: string
  domain_names: string | null
  id: number
  created_at: string | null
  updated_at: string | null
}

export interface ChainGraphAction {
  chain: string
  transaction_id: string
  contract: string
  action: string
  data: JSONValue
  authorization: JSONValue
  global_sequence: string
  action_ordinal: number
  account_ram_deltas: JSONValue | null
  receipt: JSONValue | null
  context_free: boolean | null
  account_disk_deltas: JSONValue | null
  console: string | null
  receiver: string | null
}

export interface ChainGraphBlock {
  chain: string
  block_num: number
  block_id: string | null
  timestamp: string
  producer: string
}

export interface ChainGraphTableMappings {
  scopes?: string[]
  table: string
  table_type?: 'singleton' | 'multi_index'
  primary_key: string
  computed_key_type?: 'asset_symbol' | 'symbol'
}

export interface ChainGraphMappings {
  chain: string
  contract: string
  contract_type: string | null
  tables: ChainGraphTableMappings[] | null
  abi?: JSONValue | null
}

export interface ChainGraphActionWhitelist {
  action: string
  where?: JSONValue[] | null
}

export interface ChainGraphTableWhitelist {
  table: string
  scopes?: string[] | null
}

export interface ChainGraphContractWhitelist {
  chain: string
  contract: string
  start_block: number
  actions?: ChainGraphActionWhitelist[] | null
  tables?: ChainGraphTableWhitelist[] | null
  app_id: string
}

export interface ChainGraphAppManifest {
  app_name: string
  app_id: string
  description: string
  url: string
  whitelist: ChainGraphContractWhitelist[]
}
