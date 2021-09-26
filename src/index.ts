import { logger } from './lib/logger'
import { startIndexer } from './indexer'

logger.info('Chaingraph is loading up ...')

startIndexer()
