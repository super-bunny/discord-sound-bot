import express from 'express'
import { Client } from 'discord.js'
import MediaManager from './MediaManager'
import Discord from 'discord.js'
import Api from '../api'
import { IConfig } from '../types'

export default class Bot {
  config: IConfig
  discord: Client
  mediaManager: MediaManager
  api: express.Application

  constructor(discord: Client, mediaManager: MediaManager, config?: IConfig) {
    this.discord = discord
    this.mediaManager = mediaManager
    this.config = config
  }

  async startApi(): Promise<void> {
    this.api = await Api.start(this, this.config.api)
  }

  static async init(config?: IConfig): Promise<Bot> {
    const mediaManager = await MediaManager.init(process.env.MEDIA_FOLDER)
    const discord = new Discord.Client()
    await discord.login(process.env.DISCORD_TOKEN)

    const app = new Bot(discord, mediaManager, config)
    await app.startApi()

    return app
  }
}
