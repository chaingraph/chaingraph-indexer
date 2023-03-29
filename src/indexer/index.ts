import { startRealTimeStreaming } from './real-time'
import { loadCurrentTableState } from './load-state'
import { loadHistory } from './load-history'
import { createMappingsReader } from '../mappings'
import { createWhitelistReader } from '../whitelist'

export const startIndexer = async () => {
  // get instances of the mappings and whitelist readers
  // these subscribe to mappings and whitelists on db and it always returns the latest state of it
  const mappings_reader = await createMappingsReader()

  const whitelist_reader = await createWhitelistReader()

  // start indexing state updates in real-time as soon as the server starts
  startRealTimeStreaming(mappings_reader, whitelist_reader)
  // load current state of whitelisted tables, overwritting real-time stream insn't an issue since it's the latest state
  loadCurrentTableState(mappings_reader, whitelist_reader)
  /// load historical action and transaction data from dFuse community edition
  loadHistory(whitelist_reader)
}
