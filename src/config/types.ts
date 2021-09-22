export interface EosioReaderConfig {
  name: string

  chain_id: string
  ws_url: string

  start_block: number
  stop_block: number
  irreversible_only: boolean

  ship_prefetch_blocks: number
  ship_min_block_confirmation: number

  ds_threads: number
  ds_experimental: boolean
}

export interface ReadersConfig {
  eosio: EosioReaderConfig[]
}
