import { createMappingsReader } from '../mappings'
import { createWhitelistReader } from '../whitelist'
import { loadHistory } from './load-history'
import { loadCurrentTableState } from './load-state'
import { startRealTimeStreaming } from './real-time'

export const startIndexer = async () => {
  // get instances of the mappings and whitelist readers
  // these subscribe to mappings and whitelists on db and it always returns the latest state of it
  const mappingsReader = await createMappingsReader()

  const whitelistReader = await createWhitelistReader()

  // start indexing state updates in real-time as soon as the server starts
   startRealTimeStreaming(mappingsReader, whitelistReader)
  // load current state of whitelisted tables, overwritting real-time stream insn't an issue since it's the latest state
  try {
    loadCurrentTableState(mappingsReader, whitelistReader)
  } catch (error) {
    console.error(error)
    process.exit()
  }

  // load historical action and transaction data from hyperion community edition
   loadHistory(whitelistReader)
}
