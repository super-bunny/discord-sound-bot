require('dotenv').config()

import chokidar from 'chokidar'
import Bot from './classes/Bot'
import * as env from 'env-var'
import { getBotOwner } from './utils'
import list from './commands/list'

env.get('CONFIG_FILE').asUrlString
env.get('MEDIA_FOLDER').required().asString()
env.get('DISCORD_TOKEN').required().asString()
env.get('DISCORD_OWNER_ID').required().asString()
env.get('DISCORD_ROLE_NAME').required().asString()

const config = require(process.env.CONFIG_FILE || '../config.json')

async function main() {
  const bot = await Bot.start(config)

  const watcher = chokidar.watch(process.env.MEDIA_FOLDER, {
    ignored: /^\./,
    persistent: true,
    ignoreInitial: true,
    usePolling: true,
  })
    .on('add', (path) => {
      console.log(`File ${ path.split('/').pop() } added, refreshing media list...`)
      bot.mediaManager.refresh()
        .then(() => console.log('Media list refreshed'))
        .then(() => getBotOwner(bot.discord))
        .then(owner => owner.send(`:new: File **${ path.split('/').pop() }** added. \n:recycle: Media list refreshed`))
    })
    .on('unlink', (path) => {
      console.log(`File ${ path.split('/').pop() } removed, refreshing media list...`)
      bot.mediaManager.refresh()
        .then(() => console.log('Media list refreshed'))
        .then(() => getBotOwner(bot.discord))
        .then(owner => owner.send(`:wastebasket: File **${ path.split('/').pop() }** removed. \n:recycle: Media list refreshed`))
    })
    .on('error', (error) => {
      console.error('Chokidar error happened', error)
    })


  bot.command('list', ['l', 'ls'], 'List playable sounds', (message, bot) => list(bot, message))

  bot.command('play', ['p'], 'Play specified sound', async (message, bot) => {
    if (!message.guild) {
      return message.reply('Command only available in server')
    }
    // Check if message author is in voice channel
    if (!message.member?.voice.channel) {
      return message.reply('You need to join a voice channel first!')
    }

    const queryTokens = message.content.split(' ')
    const [media] = bot.mediaManager.getBySearch(queryTokens.slice(1, queryTokens.length).join(' '))

    if (media) {
      const connection = await message.member.voice.channel.join()
      const dispatcher = connection.play(media)
    } else {
      return message.reply('Media not found :upside_down:')
    }
  })

  bot.command('random', ['r'], 'Play random sound', async (message, bot) => {
    if (!message.guild) {
      return message.reply('Command only available in server')
    }
    // Check if message author is in voice channel
    if (!message.member?.voice.channel) {
      return message.reply('You need to join a voice channel first!')
    }

    const randomIndex = Math.trunc(Math.random() * bot.mediaManager.data.length)
    const media = bot.mediaManager.data[randomIndex]
    const connection = await message.member.voice.channel.join()
    const dispatcher = connection.play(media)

    return message.reply(`Playing *${ bot.mediaManager.getFilenameList()[randomIndex] }*`)
  })


  bot.discord.on('voiceStateUpdate', (oldMember, newMember) => {
    // If a member disconnect from voice channel
    if (oldMember.channelID !== null && oldMember.channelID !== newMember.channelID) {
      const connection = bot.discord.voice.connections.find(connection => connection.channel.id === oldMember.channelID)
      // If last channel member is this bot
      if (connection && oldMember.channel.members.array().length === 1) {
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
  .catch(error => console.error(error))
