require('dotenv').config()

import fs from 'fs'
import chokidar from 'chokidar'
import Config from './classes/Config'
import Bot from './classes/Bot'
import * as env from 'env-var'
import { renameMediaFile } from './utils'
import listCommand from './commands/list'
import playCommand from './commands/play'
import randomCommand from './commands/random'
import searchCommand from './commands/search'

env.get('CONFIG_FILE').asUrlString
env.get('MEDIA_FOLDER').required().asString()
env.get('DISCORD_TOKEN').required().asString()

new Config('').app

async function main() {
  const config = await Config.fromFile(process.env.CONFIG_FILE || './config.json')
  const bot = await Bot.start(config)

  Config.check(config.config, true)

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
            .then(owner => owner.send(`:new: File **${ path.split('/').pop() }** added. \n:recycle: Media list refreshed`))
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

  bot.command('list', ['l', 'ls'], 'List playable sounds', listCommand)
  bot.command('search', ['s'], 'Search sound', searchCommand)
  bot.command('play', ['p'], 'Play specified sound', playCommand)
  bot.command('random', ['r'], 'Play random sound', randomCommand)

  bot.discord.on('voiceStateUpdate', (oldMember, newMember) => {
    // If a member disconnect from voice channel
    if (oldMember.channelID !== null && oldMember.channelID !== newMember.channelID) {
      const connection = bot.discord.voice.connections.find(connection => connection.channel.id === oldMember.channelID)
      // If last channel member is this bot
      if (connection && oldMember.channel.members.array().every(member => member.user.bot)) {
        connection.disconnect()
      }
    }
  })

  bot.discord.on('ready', () => {
    console.log('Discord bot ready!')
  })
}

main()
  .then()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
