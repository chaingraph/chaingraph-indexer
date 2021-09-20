import * as env from 'env-var'
import { ReadersConfig } from '../types/config'
import { readers } from './readers.config'

export interface Config {
  database_url: string
  port: number
  readers: ReadersConfig
}

export const config: Config = {
  database_url: env.get('DATABASE_URL').required().asString(),
  port: env.get('PORT').required().asIntPositive(),
  readers,
}
