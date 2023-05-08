import { SlashCommand, SlashCommandOptions, SlashCreator, ThrottleObject } from 'slash-create'
import Throttler from './Throttler.js'

export type SlashCommandThrottles = Map<string, ThrottleObject>

export interface EnhancedSlashCommandOptions extends SlashCommandOptions {
  // Overwrite internal throttle cache
  throttleCache?: SlashCommandThrottles
}

// SlashCommand class wrapper with some additional features
export default class EnhancedSlashCommand extends SlashCommand {
  // Current throttle objects for the command, mapped by user ID
  public throttleCache: SlashCommandThrottles = new Map<string, ThrottleObject>()

  constructor(creator: SlashCreator, options: EnhancedSlashCommandOptions) {
    super(creator, options)

    if (options.throttleCache) this.throttleCache = options.throttleCache
  }

  // Get new Throttler instance
  get throttler(): Throttler | undefined {
    if (!this.throttling) return undefined

    return new Throttler(this.throttling.usages, this.throttling.duration, this.throttleCache)
  }

  throttle(userID: string): ThrottleObject | null {
    if (!this.throttling) return null

    let throttle = this.throttleCache.get(userID)

    if (!throttle) {
      throttle = {
        start: Date.now(),
        usages: 0,
        timeout: setTimeout(() => {
          this.throttleCache.delete(userID)
        }, this.throttling.duration * 1000),
      }
      this.throttleCache.set(userID, throttle)
    }

    return throttle
  }
}
