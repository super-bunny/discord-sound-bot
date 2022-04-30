import { CommandNames } from './CommandNames'

export interface CommandThrottlingOptions {
  // Command usage allowed in duration
  usages: number,
  // Time frame (in second) for command usage count
  duration: number,
}

export type ThrottleAllowedCommands = CommandNames.PLAY | CommandNames.RANDOM

export interface AppConfig {
  listPageSize: number
  ownerDiscordId: string
  roleDiscordName: string
  // Throttling options per command. Command without config will not be throttled.
  commandThrottling?: Partial<Record<ThrottleAllowedCommands, CommandThrottlingOptions>>,
}


export type ApiConfigToken = {
  token: string
  discordMemberId: string
}

export interface ApiConfig {
  tokens: Array<ApiConfigToken>
}


export interface RawConfig {
  app: AppConfig
  api: ApiConfig
}
