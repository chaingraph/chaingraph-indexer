import { APIClient, FetchProvider } from "@wharfkit/antelope"
import fetch from 'node-fetch'
import { config } from '../config'
const provider = new FetchProvider(config.reader.rpc_url, {
  fetch,
})
export const rpc = new APIClient({ provider })

export const getInfo = async () =>
  fetch(`${config.reader.rpc_url}/v1/chain/get_info`).then((res: any) =>
    res.json(),
  )
