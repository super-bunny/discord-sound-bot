import { ThrottleAllowedCommands } from './Config'
import Throttler from '../classes/Throttler'

export default interface Cache {
  throttles: Record<ThrottleAllowedCommands, Throttler | undefined>
}
