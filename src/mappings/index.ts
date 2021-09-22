import { Subject } from 'rxjs'
import { log } from '../lib/logger'
import { db } from '../lib/prisma'
import { ContractMappings } from './types'

export const createMappingsSubject = () => {
  const mappings$ = new Subject<ContractMappings>()

  log.info('Subscribing to contract mappings, refreshing every 1s ...')
  setInterval(async () => {
    try {
      const data = await db.mappings.findMany()

      const mappings = data.map((row) => row.mappings as ContractMappings)

      mappings$.next(mappings)
    } catch (error) {
      log.error('Error updating contract mappings', error)
    }
  }, 1000)

  return { mappings$ }
}
