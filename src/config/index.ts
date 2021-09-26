import * as env from 'env-var'

export interface EosioReaderConfig {
  chain: string

  chain_id: string
  ws_url: string
  rpc_url: string

  start_block?: number
  stop_block?: number
  irreversible_only: boolean

  ship_prefetch_blocks: number
  ship_min_block_confirmation: number

  ds_threads: number
  ds_experimental: boolean
}

export interface Config {
  database_url: string
  reader: EosioReaderConfig
}

export const config: Config = {
  database_url:
    'postgres://graph_overlord:sbq6E684F38FXNSmyD39Poh5jnq5gk@chaingraph.cluster-cjxjy2z3vanz.us-east-1.rds.amazonaws.com:5432/chaingraph?sslmode=disable',
  reader: {
    chain: 'jungle',
    chain_id:
      '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840',
    ws_url: env.get('WS_URL').asString() || 'ws://localhost:8078',
    rpc_url: env.get('RPC_URL').asString() || 'http://localhost:8878',
    irreversible_only: false,
    ship_prefetch_blocks: 50,
    ship_min_block_confirmation: 30,
    ds_threads: 4,
    ds_experimental: false,
  },
}
