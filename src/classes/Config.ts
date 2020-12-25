import { merge } from 'lodash'
import fs from 'fs'

export default class Config {
  static default: RawConfig = {
    app: {
      listPageSize: 25,
      listDeleteOriginMessage: false,
      prefix: '/',
      ownerDiscordId: '',
      roleDiscordName: 'soundbot',
    },
    api: {
      tokens: [],
    },
  }

  path: string
  config?: RawConfig

  constructor(path: string) {
    this.path = path
  }

  get app(): AppConfig | undefined {
    return this.config?.app
  }

  get api(): ApiConfig {
    return this.config.api
  }

  async load(overwriteOnError = true): Promise<void> {
    try {
      const rawConfig = await fs.promises.readFile(this.path)
      this.config = merge(Config.default, JSON.parse(rawConfig.toString()))
    } catch (e) {
      if (overwriteOnError) {
        if (!this.config) {
          this.config = Config.default
        }
        return this.save()
      }
      throw e
    }
  }

  async save(): Promise<void> {
    return fs.promises.writeFile(this.path, this.toJSON())
  }

  toJSON(): string {
    return JSON.stringify(this.config, null, 4)
  }

  static check(config: RawConfig, printMessage: boolean = false): Boolean {
    const properties: Array<CheckProperty> = [
      {
        message: 'Missing bot owner id in config, some features may not work',
        check: config => config.app.ownerDiscordId.length > 0,
      },
    ]
    const checkResults = properties.map(property => property.check(config))
    checkResults.forEach((result, index) => !result && printMessage && console.warn(properties[index].message))
    return !checkResults.includes(false)
  }

  static async fromFile(path: string, ...args: Parameters<typeof Config.prototype.load>): Promise<Config> {
    const config = new Config(path)
    await config.load(...args)
    return config
  }
}


export interface RawConfig {
  app: AppConfig
  api: ApiConfig
}

export interface AppConfig {
  listPageSize: number
  listDeleteOriginMessage: boolean
  prefix: string
  ownerDiscordId: string
  roleDiscordName: string
}

export interface ApiConfig {
  tokens: Array<{
    token: string
    discordMemberId: string
  }>
}

interface CheckProperty {
  message: string
  check: (config: RawConfig) => boolean
}
