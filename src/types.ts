export interface ApiConfig {
  tokens: Array<{
    token: string
    discordMemberId: string
  }>
}

export interface IConfig {
  prefix: string
  api: ApiConfig
}
