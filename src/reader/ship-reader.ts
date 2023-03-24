import {
  createEosioShipReader,
  EosioReaderConfig,
} from '@blockmatic/eosio-ship-reader'
import { config } from '../config'
import { getInfo } from '../lib/eosio'
import { logger } from '../lib/logger'
import { MappingsReader } from '../mappings'
import { WhitelistReader } from '../whitelist'
import { createShipReaderDataHelper } from './reader-helper'

export const loadReader = async (
  mappingsReader: MappingsReader,
  whitelistReader: WhitelistReader,
) => {
  // First we need to get the ABis for all whitelisted contracts
  const readerHelper = await createShipReaderDataHelper(
    mappingsReader,
    whitelistReader,
  )

  const readerConfig = config.reader
  const start_block_num =
    readerConfig.start_block || (await getInfo()).head_block_num

  const eosioReaderConfig: EosioReaderConfig = {
    ws_url: readerConfig.ws_url,
    rpc_url: readerConfig.rpc_url,
    ds_threads: readerConfig.ds_threads,
    ds_experimental: readerConfig.ds_experimental,
    ...readerHelper,
    request: {
      start_block_num,
      end_block_num: 0xffffffff,
      max_messages_in_flight: 50,
      have_positions: [],
      irreversible_only: false,
      fetch_block: true,
      fetch_traces: true,
      fetch_deltas: true,
    },
    auto_start: true,
  }

  // logger.info(
  //   'Creating EOSIO SHiP Reader with config ',
  //   JSON.stringify(
  //     {
  //       ...eosioReaderConfig,
  //       delta_whitelist: readerHelper.delta_whitelist(),
  //       contract_abis: readerHelper
  //         .contract_abis()
  //         .forEach((_value, key) => ({ contract: key })),
  //       table_rows_whitelist: readerHelper.table_rows_whitelist(),
  //       actions_whitelist: readerHelper.actions_whitelist(),
  //     },
  //     null,
  //     2,
  //   ),
  // )

  return await createEosioShipReader(eosioReaderConfig)
}
