import express from 'express'
import Discord, { Client, Intents } from 'discord.js'
import MediaManager from './MediaManager'
import Api from '../api'
import Config from './Config'

export default class Bot {
  config: Config
  discord: Client
  mediaManager: MediaManager
  api: express.Application

  constructor(discord: Client, mediaManager: MediaManager, config: Config) {
    this.discord = discord
    this.mediaManager = mediaManager
    this.config = config
  }

  async getOwner() {
    return this.discord.users.fetch(this.config.app.ownerDiscordId)
  }

  async startApi(): Promise<void> {
    this.api = await Api.start(this, this.config.api)
  }

  static async start(config: Config): Promise<Bot> {
    const mediaManager = await MediaManager.init(process.env.MEDIA_FOLDER)
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
    await discord.login(process.env.DISCORD_TOKEN)

    const app = new Bot(discord, mediaManager, config)
    await app.startApi()

    return app
  }
}
