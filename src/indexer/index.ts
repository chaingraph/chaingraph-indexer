import { startRealTimeStreaming } from './real-time'
import { loadCurrentTableState } from './load-state'
import { loadHistory } from './load-history'
import { createMappingsReader } from '../mappings'

export const startIndexer = async () => {
  // get an instance of the mappings reader
  // this subscribes the mappings on db and it always returns the latest mapping
  // soon these mappings will come from a smart contract, for now we are using a pg db to get going
  const mappingsReader = await createMappingsReader()
  // start indexing state updates in real-time as soon as the server starts
  startRealTimeStreaming(mappingsReader)
  // load current state of whitelisted tables, overwritting real-time stream shouldn't be an issue since it's the latest state
  // loadCurrentTableState(whitelistReader)
  // // load historical action and transaction data from dFuse community edition
  // loadHistory(whitelistReader)
}
