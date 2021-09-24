import { Subject } from 'rxjs'
import { log } from '../lib/logger'
import { db } from '../lib/db'
import { ContractMappings } from './types'
import { config } from '@blockmatic/eosio-ship-reader'

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
      const result: ContractMappings[] = await db.query(
        'SELECT * FROM mappings',
      )
      // type hackerish
      // update and broadcast if there's new data
      if (JSON.stringify(result) !== JSON.stringify(mappings)) {
        mappings = result
        mappings$.next(mappings)
        // log.info('New mappings', JSON.stringify(mappings))
      }
    } catch (error) {
      log.error('Error updating contract mappings', error)
    }
  }, 1000)

  return { mappings$, mappings }
}
