import { JsonRpc } from '@eoscafe/hyperion'
import { config } from '../config'
import fetch from 'isomorphic-fetch'

export const hyperion = new JsonRpc(config.hyperion_url, { fetch })

export { Action as HyperionAction } from '@eoscafe/hyperion'
