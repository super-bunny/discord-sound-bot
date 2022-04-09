import { JSONFile, Low } from 'lowdb'
import { RawConfig } from '../types/Config'

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
    return config
  }
}
