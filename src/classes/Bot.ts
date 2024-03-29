import env from 'env-var'
import express from 'express'
import Discord, { Client, GatewayIntentBits, Partials } from 'discord.js'
import MediaManager from './MediaManager.js'
import Api from '../api.js'
import Config from './Config.js'
import Cache from '../types/Cache.js'
import Throttler from './Throttler.js'

export default class Bot {
  config: Config
  discord: Client
  mediaManager: MediaManager
  api?: express.Application
  cache: Cache

  constructor(discord: Client, mediaManager: MediaManager, config: Config) {
    this.discord = discord
    this.mediaManager = mediaManager
    this.config = config
    this.cache = this.getInitialCache()
  }

  // Initialize and return cache instance
  protected getInitialCache(): Cache {
    const { play, random } = this.config.data.app.commandThrottling ?? {}

    return {
      throttles: {
        play: play ? new Throttler(play.usages, play.duration) : undefined,
        random: random ? new Throttler(random.usages, random.duration) : undefined,
      },
    }
  }

  async getOwner() {
    return this.discord.users.fetch(this.config.data.app.ownerDiscordId)
  }

  async startApi(): Promise<void> {
    this.api = await Api.start(this, this.config.data.api)
  }

  static async start(config: Config): Promise<Bot> {
    const mediaManager = await MediaManager.init(env.get('MEDIA_FOLDER').required().asString())
    const discord = new Discord.Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [Partials.Channel],
    })

    console.info(`${ mediaManager.medias.length } media(s) found`)
    await discord.login(process.env.DISCORD_TOKEN)

    const app = new Bot(discord, mediaManager, config)
    await app.startApi()

    return app
  }
}
