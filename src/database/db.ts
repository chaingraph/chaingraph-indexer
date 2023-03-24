import createPGP from 'pg-promise'
import { config } from '../config'

export const pgp = createPGP({
  capSQL: true, // generate capitalized SQL
})

export const db = pgp(config.database_url)
