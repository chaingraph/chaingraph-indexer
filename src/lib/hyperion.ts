import { JsonRpc } from '@eoscafe/hyperion'
import { config } from '../config'

export const hyperion = new JsonRpc(config.hyperion_url)

export { Action as HyperionAction } from '@eoscafe/hyperion'
