import { merge } from 'lodash'
import fs from 'fs'

export default class Config {
  static default: RawConfig = {
    app: {
      listPageSize: 25,
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
    const rawConfig = await fs.promises.readFile(this.path)

    try {
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
