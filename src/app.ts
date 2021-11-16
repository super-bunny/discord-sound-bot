require('dotenv').config()

import PlayCommand from './slashCommands/play'
import fs from 'fs'
import { GatewayServer, SlashCreator } from 'slash-create'
import { getVoiceConnection } from '@discordjs/voice'
import chokidar from 'chokidar'
import Config from './classes/Config'
import Bot from './classes/Bot'
import * as env from 'env-var'
import renameMediaFile from './utils/renameMediaFile'
import PingCommand from './slashCommands/ping'
import RandomCommand from './slashCommands/random'
import SearchCommand from './slashCommands/search'
import ListCommand from './slashCommands/list'

env.get('CONFIG_FILE').asUrlString
env.get('MEDIA_FOLDER').required().asString()
env.get('DISCORD_TOKEN').required().asString()

new Config('').app

async function main() {
  const config = await Config.fromFile(process.env.CONFIG_FILE || './config.json')

  Config.check(config.config, true)

  const bot = await Bot.start(config)

  const creator = new SlashCreator({
    applicationID: process.env.DISCORD_APP_ID,
    publicKey: process.env.DISCORD_PUBLIC_KEY,
    token: process.env.DISCORD_TOKEN,
  })
  creator
    .withServer(new GatewayServer(
      (handler) => bot.discord.ws.on('INTERACTION_CREATE', handler),
    ))
    .registerCommands([
      new PlayCommand(creator, bot.discord, bot.mediaManager),
      new PingCommand(creator),
      new RandomCommand(creator, bot.discord, bot.mediaManager),
      new SearchCommand(creator, bot.mediaManager),
      new ListCommand(creator, bot.mediaManager, config),
    ])
    .syncCommands() // Sync command with Discord API
    .on('debug', (message) => console.log(message))
    .on('warn', (message) => console.warn(message))
    .on('error', (error) => console.error(error))
    .on('synced', () => console.info('Commands synced!'))
    .on('commandRun', (command, _, ctx) =>
      console.info(`${ ctx.user.username }#${ ctx.user.discriminator } (${ ctx.user.id }) ran command ${ command.commandName }`))
    .on('commandRegister', (command) =>
      console.info(`Registered command ${ command.commandName }`))
    .on('commandError', (command, error) => console.error(`Command ${ command.commandName }:`, error))

  const watcher = chokidar.watch(process.env.MEDIA_FOLDER, {
    ignored: /^\./,
    persistent: true,
    ignoreInitial: true,
    usePolling: true,
  })
    .on('add', async (path) => {
      const newPath = renameMediaFile(path)

      if (path !== newPath) {
        console.log(`File ${ path.split('/').pop() } added, renaming...`)
        watcher.unwatch(path)
        return fs.promises.rename(path, renameMediaFile(path))
      }

      console.log(`File ${ path.split('/').pop() } added, refreshing media list...`)
      bot.mediaManager.refresh()
        .then(() => {
          console.info('Media list refreshed')
          bot.getOwner()
            .then(owner => owner
              .send(`:new: File **${ path.split('/').pop() }** added. \n:recycle: Media list refreshed`))
            .catch((error) => console.warn('Failed to notify bot owner of media list refresh\n', error))
        })
    })
    .on('unlink', (path) => {
      console.log(`File ${ path.split('/').pop() } removed, refreshing media list...`)
      bot.mediaManager.refresh()
        .then(() => {
          console.info('Media list refreshed')
          bot.getOwner()
            .then(owner => owner.send(`:wastebasket: File **${ path.split('/').pop() }** removed. \n:recycle: Media list refreshed`))
            .catch((error) => console.warn('Failed to notify bot owner of media list refresh\n', error))
        })
    })
    .on('error', (error) => {
      console.error('Chokidar error happened', error)
    })

  bot.discord.on('voiceStateUpdate', (oldMember, newMember) => {
    // If a member disconnect from voice channel
    if (oldMember.channelId !== null && oldMember.channelId !== newMember.channelId) {
      const connection = getVoiceConnection(oldMember.guild.id)
      // If last channel member is this bot
      if (connection && oldMember.channel.members.every(member => member.user.bot)) {
        connection.disconnect()
      }
    }
  })

  bot.discord.on('ready', () => {
    console.log('Discord bot ready!')
  })

  bot.discord.on('error', (error) => {
    console.error(error)
  })
}

main()
  .then()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
