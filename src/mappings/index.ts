import { Subject } from 'rxjs'
import { log } from '../lib/logger'
import { db } from '../lib/prisma'
import { ContractMappings } from './types'

export interface MappingsReader {
  mappings$: Subject<ContractMappings[]>
  mappings: ContractMappings[]
}

export const createMappingsReader = () => {
  let mappings: ContractMappings[] = []
  const mappings$ = new Subject<ContractMappings[]>()

  log.info('Subscribing to contract mappings, refreshing every 1s ...')
  setInterval(async () => {
    try {
      const result = await db.mappings.findMany()
      // type hackerish
      const freshMappings = result as unknown as ContractMappings[]
      // update and broadcast if there's new data
      if (JSON.stringify(freshMappings) !== JSON.stringify(mappings)) {
        mappings = freshMappings
        mappings$.next(mappings)
      }
    } catch (error) {
      log.error('Error updating contract mappings', error)
    }
  }, 1000)

  return { mappings$, mappings }
}
