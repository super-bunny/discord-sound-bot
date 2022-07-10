import env from 'env-var'
import express from 'express'
import Discord, { Client, Intents } from 'discord.js'
import MediaManager from './MediaManager'
import Api from '../api'
import Config from './Config'
import Cache from '../types/Cache'
import Throttler from './Throttler'

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
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGES,
      ],
      partials: ['CHANNEL'],
    })

    console.info(`${ mediaManager.medias.length } media(s) found`)
    await discord.login(process.env.DISCORD_TOKEN)

    const app = new Bot(discord, mediaManager, config)
    await app.startApi()

    return app
  }
}
