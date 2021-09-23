export interface ContractMappingsTable {
  scopes?: string[]
  table: string
  table_type?: 'singleton' | 'multi_index'
  primary_key: string
  computed_key_type?: 'asset_symbol' | 'symbol'
}

export interface ContractMappings {
  chain: string
  contract: string
  contract_type: string
  actions: string[] | '*'
  tables: ContractMappingsTable[]
}
