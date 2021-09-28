import { Subject } from 'rxjs'
import { logger } from './lib/logger'
import { db } from './database'
import { ChainGraphContractWhitelist } from './types'

export interface whitelistReader {
  whitelist$: Subject<ChainGraphContractWhitelist[]>
  whitelist: ChainGraphContractWhitelist[]
}

export const createWhitelistReader = () => {
  let whitelist: ChainGraphContractWhitelist[] = []
  const whitelist$ = new Subject<ChainGraphContractWhitelist[]>()

  logger.info('Subscribing to contract whitelist, refreshing every 1s ...')
  setInterval(async () => {
    try {
      const result: ChainGraphContractWhitelist[] = await db.query(
        'SELECT * FROM whitelists',
      )
      // update and broadcast if there's new data
      if (JSON.stringify(result) !== JSON.stringify(whitelist)) {
        whitelist = result
        whitelist$.next(whitelist)
        // logger.info('New whitelist', JSON.stringify(whitelist))
      }
    } catch (error) {
      logger.error('Error updating contract whitelist', error)
    }
  }, 1000)

  return { whitelist$, whitelist }
}
