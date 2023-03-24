import { APIClient, FetchProvider } from '@greymass/eosio'
import fetch from 'node-fetch'
import { config } from '../config'

export const api = new APIClient({
  provider: new FetchProvider(config.reader.rpc_url, { fetch }),
})
