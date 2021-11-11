import express from 'express'
import Discord, { Client, Intents, Message } from 'discord.js'
import MediaManager from './MediaManager'
import Api from '../api'
import Config from './Config'

// ====================
// Types and interfaces
// ====================
export type CommandHandler = (message: Message, bot: Bot) => Promise<unknown> | void

export interface ICommand {
  name: string
  aliases: Array<string>
  description: string
  handler: CommandHandler
}

// ====================

export default class Bot {
  config: Config
  discord: Client
  commands: Array<ICommand> = []
  mediaManager: MediaManager
  api: express.Application

  constructor(discord: Client, mediaManager: MediaManager, config: Config) {
    this.discord = discord
    this.mediaManager = mediaManager
    this.config = config

    this.addCommandListener()
  }

  private addCommandListener() {
    this.discord.on('messageCreate', async (message) => {
      const commandPrefix = this.config.app.prefix
      const content = message.content
      const commandName = content.slice(commandPrefix.length, content.length).split(' ')[0]

      // Ignore bot messages
      if (message.author.bot) {
        return
      }
      // Check command prefix
      if (!content.startsWith(commandPrefix)) {
        return
      }
      // Check required role if message was posted on a server
      if (message.guild && !message.member.roles.cache.some(role => role.name === this.config.app.roleDiscordName)) {
        return
      }

      const matchedCommand = this.commands
        .find(command => command.name === commandName || command.aliases.find(alias => alias === commandName))

      if (matchedCommand) {
        matchedCommand.handler(message, this)
        return
      }

      message.reply('Unknown command')
    })
  }

  private findCommand(nameOrAlias: string): ICommand {
    return this.commands.find(command =>
      command.name === nameOrAlias ||
      command.aliases.find(alias => alias === nameOrAlias),
    )
  }

  async getOwner() {
    return this.discord.users.fetch(this.config.app.ownerDiscordId)
  }

  async startApi(): Promise<void> {
    this.api = await Api.start(this, this.config.api)
  }

  command(name: string, aliases: Array<string>, description: string, handler: CommandHandler) {
    const duplicateCommandName = [name, ...aliases].find(nameOrAlias => this.findCommand(nameOrAlias))

    if (name.length === 0) {
      throw new Error('Empty command name given')
    }
    if (duplicateCommandName) {
      throw new Error(`Duplicate command : "${ duplicateCommandName }" name/alias is already taken by "${ this.findCommand(duplicateCommandName).name }" command`)
    }
    this.commands.push({
      name,
      aliases: aliases.filter(alias => alias.length > 0),
      description,
      handler,
    })
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
