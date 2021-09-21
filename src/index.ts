import { log } from './lib/logger'
import { startIndexer } from './indexer'

log.info('Chaingraph is loading up ...')

startIndexer()
