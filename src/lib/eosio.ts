import { RpcInterfaces } from 'eosjs'
import fetch from 'node-fetch'
import { JsonRpc } from 'eosjs'
import { config } from '../config'

export const rpc = new JsonRpc(config.reader.rpc_url, { fetch })

export const getInfo = async () =>
  fetch(`${config.reader.rpc_url}/v1/chain/get_info`, {
    headers: {
      'Content-Type': 'application/json',
    }
  }).then((res: any) =>
    res.json(),
  )

export const getNationInfo = () =>
  fetch('http://api.eosn.io/v1/chain/get_info', {
    headers: {
      'Content-Type': 'application/json',
    }
  }).then((res: any) => res.json())

export const fecthAbi = (account_name: string) =>
  fetch(`${config.reader.rpc_url}/v1/chain/get_abi`, {
    method: 'POST',
    body: JSON.stringify({
      account_name,
    }),
    headers: {
      'Content-Type': 'application/json',
    }
  }).then(async (res: any) => {
    const response = await res.json()
    return {
      account_name,
      abi: response.abi as RpcInterfaces.Abi,
    }
  })

export const getTableByScope = (params: { code: string, table: string, limit: number }) =>
  fetch(`${config.reader.rpc_url}/v1/chain/get_table_by_scope`, {
    method: 'POST',
    body: JSON.stringify(params),
    headers: {
      'Content-Type': 'application/json',
    }
  }).then((res: any) => res.json())
