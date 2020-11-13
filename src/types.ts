export interface ApiConfig {
  tokens: Array<{
    token: string
    discordMemberId: string
  }>
}

export interface IConfig {
  listPageSize: number,
  prefix: string
  api: ApiConfig
}
