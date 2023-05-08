import { ThrottleAllowedCommands } from './Config.js'
import Throttler from '../classes/Throttler.js'

export default interface Cache {
  throttles: Record<ThrottleAllowedCommands, Throttler | undefined>
}
