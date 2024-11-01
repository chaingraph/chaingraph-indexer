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
  delphioracle_producers: string[]
  hyperion_url: string
  reader: EosioReaderConfig
}

export const config: Config = {
  database_url: env.get('DATABASE_URL').required().asString(),
  delphioracle_producers: env
    .get('DELPHIORACLE_PRODUCERS')
    .required()
    .asArray(),
  reader: {
    chain: 'eos',
    chain_id:
      'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    ws_url: env.get('WS_URL').asString() || 'ws://localhost:8080',
    rpc_url: env.get('RPC_URL').asString() || 'http://localhost:8888',
    irreversible_only: false,
    ship_prefetch_blocks: 50,
    ship_min_block_confirmation: 30,
    ds_threads: 4,
    ds_experimental: false,
  },
  hyperion_url: env.get('HYPERION_RPC_URL').asString(),
}
