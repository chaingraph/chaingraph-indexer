import { Subject } from 'rxjs'
import { logger } from './lib/logger'
import { db } from './database'
import { ChainGraphMappings } from './types'

export interface MappingsReader {
  mappings$: Subject<ChainGraphMappings[]>
  mappings: ChainGraphMappings[]
}

export const createMappingsReader = () => {
  let mappings: ChainGraphMappings[] = []
  const mappings$ = new Subject<ChainGraphMappings[]>()

  logger.info('Subscribing to contract mappings, refreshing every 1s ...')
  setInterval(async () => {
    try {
      const result: ChainGraphMappings[] = await db.query(
        'SELECT * FROM mappings',
      )
      // type hackerish
      // update and broadcast if there's new data
      if (JSON.stringify(result) !== JSON.stringify(mappings)) {
        mappings = result
        mappings$.next(mappings)
        // logger.info('New mappings', JSON.stringify(mappings))
      }
    } catch (error) {
      logger.error('Error updating contract mappings', error)
    }
  }, 1000)

  return { mappings$, mappings }
}
