import { JSONFile, Low } from 'lowdb'
import { RawConfig } from '../types/Config.js'

export default class Config extends Low<RawConfig> {
  static defaultConfig: RawConfig = {
    app: {
      listPageSize: 25,
      ownerDiscordId: '',
      roleDiscordName: 'soundbot',
    },
    api: {
      tokens: [],
    },
  }

  readonly path: string

  // Override Lowdb data property to make it non nullable
  data: RawConfig

  constructor(path: string) {
    const adapter = new JSONFile<RawConfig>(path)
    super(adapter)

    this.path = path
    this.data ??= Config.defaultConfig
  }

  static async init(path: string) {
    const config = new Config(path)

    await config.read()
    config.data = {
      app: {
        ...Config.defaultConfig.app,
        ...(config.data.app ?? {}),
      },
      api: {
        ...Config.defaultConfig.api,
        ...(config.data.api ?? {}),
      },
    }
    await config.write()

    return config
  }
}
