import uniqBy from 'lodash.uniqby'
import pThrottle from 'p-throttle'
import { config } from '../config'
import { upsertActions, upsertBlocks, upsertTransactions } from '../database'
import { HyperionAction, hyperion } from '../lib/hyperion'
import { logger } from '../lib/logger'
import { whilst } from '../lib/promises'
import {
  ChainGraphAction,
  ChainGraphActionWhitelist,
  ChainGraphBlock,
  ChainGraphTransaction,
} from '../types'
import { WhitelistReader } from '../whitelist'

type UpsertCollections = {
  actions: ChainGraphAction[]
  transactions: ChainGraphTransaction[]
  blocks: ChainGraphBlock[]
}

const loadHyperionActions = async (hyperion_actions: HyperionAction<any>[]) => {
  logger.info(`Loading ${hyperion_actions.length} hyperion actions ...`)
  try {
    const objects: UpsertCollections = hyperion_actions.reduce(
      (accumulator: UpsertCollections, action: any) => {
        accumulator.actions.push({
          chain: config.reader.chain,
          transaction_id: action.trx_id,
          contract: action.act.account,
          action: action.act.name,
          data: action.act.data,
          authorization: action.act.authorization,
          global_sequence: action.global_sequence.toString(),
          action_ordinal: action.action_ordinal,
          account_ram_deltas: [],
          receipt: {},
          context_free: false,
          account_disk_deltas: [],
          console: '',
          receiver: '',
        })

        accumulator.blocks.push({
          chain: config.reader.chain,
          block_num: action.block_num,
          block_id: action.block_id,
          producer: action.producer,
          timestamp: action.timestamp,
        })

        accumulator.transactions.push({
          chain: config.reader.chain,
          block_num: action.block_num,
          transaction_id: action.trx_id,
          cpu_usage_us: 0,
          net_usage_words: 0,
          net_usage: 0,
        })

        return {
          actions: accumulator.actions,
          blocks: uniqBy(accumulator.blocks, 'block_num'),
          transactions: uniqBy(accumulator.transactions, 'transaction_id'),
        }
      },
      { actions: [], transactions: [], blocks: [] },
    )

    await upsertBlocks(objects.blocks)

    await upsertTransactions(objects.transactions)

    await upsertActions(objects.actions)
    return true
  } catch (error) {
    logger.error(
      '=> hyperion_actions:',
      Object.keys(error.response),
      error.response.errors,
    )
    // throw error
    return true // ignore the error for now - Gabo
  }
}

export const loadActionHistory = async (account: string, filter: string) => {
  // walk over hyperion pagination.
  const hyperionPageSize = 1000
  const now = Date.now()

  let page = 0
  let morePages = true
  const hasMorePages = () => morePages

  const throttleRequest = pThrottle({
    limit: 1,
    interval: 1000,
  })

  const throttledHyperionGetActions = throttleRequest((pageNumber: number) => {
    const secDiff = ((Date.now() - now) / 1000).toFixed()
    logger.info(
      `===> throttledHyperionGetActions for ${account}:${filter} with a ${secDiff} difference from starting time`,
    )
    return hyperion.get_actions(account, {
      filter: `${account}:${filter}`,
      limit: hyperionPageSize,
      skip: hyperionPageSize * pageNumber,
    })
  })

  const loadHyperionPages = async () => {
    const filter_page = `filter: ${account}:${filter}, limit: ${hyperionPageSize}, skip: ${hyperionPageSize * page}, page ${page}`
    logger.info(`Loading action history from Hyperion for ${filter_page}`)

    try {
      const response = await throttledHyperionGetActions(page)
      if (response.actions.length > 0) {
        await loadHyperionActions(response.actions)
        page++
        return true
      }
      logger.info(`BAZINGA STOP. setting morePages to false for ${filter_page}`)
      morePages = false
      return false
    } catch (error) {
      logger.error('Hyperion request failed: ', error)
      return process.exit(0) // keep trying
    }
  }

  await whilst(hasMorePages, loadHyperionPages)

  logger.info('Succesfully loaded history from Hyperion!')
}

export const loadHistory = async (whitelistReader: WhitelistReader) => {
  logger.info('Loading action and transaction history ...')
  try {
    const actionFilters = whitelistReader.whitelist
      .map(({ contract: code, actions }) => {
        // if wildcard we need reformat for hyperion
        if (actions[0] === '*') return [{ code, action: '*' }]

        return (actions as ChainGraphActionWhitelist[]).map(({ action }) => {
          return {
            code,
            action,
          }
        })
      })
      .flat()

    await Promise.all(
      actionFilters.map(async ({ action, code }) => loadActionHistory(code, action),
      ),
    )
  } catch (error) {
    console.error(
      'Error loading actions and transaction data from Hyperion',
      error,
    )
  }
}
