export interface ThrottleObject {
  start: number;
  usages: number;
  timeout: any;
}

export type ThrottleCache = Map<string, ThrottleObject>

export default class Throttler {
  // Command usage allowed in duration
  public usages: number
  // Time frame (in second) for command usage count
  public duration: number
  // Current throttle objects, mapped by key
  public cache: ThrottleCache = new Map<string, ThrottleObject>()

  constructor(usages: number, duration: number, cache?: ThrottleCache) {
    this.usages = usages
    this.duration = duration
    if (cache) this.cache = cache
  }

  public getThrottle(key: string): ThrottleObject {
    let throttle = this.cache.get(key)

    if (!throttle) {
      throttle = {
        start: Date.now(),
        usages: 0,
        timeout: setTimeout(() => {
          this.cache.delete(key)
        }, this.duration * 1000),
      }
      this.cache.set(key, throttle)
    }

    return throttle
  }

  // Check if given key is actually throttled
  public isThrottled(key: string): boolean {
    const throttle = this.getThrottle(key)

    return throttle.usages >= this.usages
  }

  // Register a usage for the given key
  public registerUsage(key: string): number {
    const throttle = this.getThrottle(key)

    this.cache.set(key, { ...throttle, usages: throttle.usages + 1 })

    return throttle.usages + 1
  }

  // Get remaining throttle duration in second for the given key
  public getRemainingDuration(key: string): number | null {
    const throttle = this.getThrottle(key)

    if (!this.isThrottled(key)) {
      return null
    }

    return throttle.start + this.duration * 1000 - Date.now()
  }
}
