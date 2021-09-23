import { Subject } from 'rxjs'
import fs from 'fs'
import path from 'path'
import { log } from '../lib/logger'
import { ContractMappings } from './types'

export const createMappingsSubject = () => {
  const mappings$ = new Subject<ContractMappings[]>()

  log.info('Subscribing to contract mappings, refreshing every 1s ...')
  setInterval(async () => {
    try {
      const mappings: ContractMappings[] = []
      const jsonsInDir = fs
        .readdirSync(__dirname)
        .filter((file) => path.extname(file) === '.json')

      jsonsInDir.forEach((file) => {
        const fileData = fs.readFileSync(path.join(__dirname, file))
        // TODO: validate mappings
        mappings.push(JSON.parse(fileData.toString()) as ContractMappings)
      })

      mappings$.next(mappings)
    } catch (error) {
      log.error('Error updating contract mappings', error)
    }
  }, 1000)

  return { mappings$ }
}
