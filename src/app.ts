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
        .then(owner => owner.send(`File **${ path.split('/').pop() }** added. :new:\nMedia list refreshed :recycle:`))
    })
    .on('unlink', (path) => {
      console.log(`File ${ path.split('/').pop() } removed, refreshing media list...`)
      bot.mediaManager.refresh()
        .then(() => console.log('Media list refreshed'))
        .then(() => getBotOwner(bot.discord))
        .then(owner => owner.send(`File **${ path.split('/').pop() }** removed. :wastebasket:\nMedia list refreshed :recycle:`))
    })
    .on('error', (error) => {
      console.error('Chokidar error happened', error)
    })

  bot.discord.on('ready', () => {
    console.log('Discord bot ready!')
  })

  bot.discord.on('message', async message => {
    // Voice only works in guilds, if the message does not come from a guild,
    // we ignore it
    if (!message.guild) return

    if (!message.member.roles.cache.some(role => role.name === process.env.DISCORD_ROLE_NAME)) {
      return
    }
    if (message.content.split(' ').shift() === '/p') {
      // Prevent non authorized member to execute command
      // Only try to join the sender's voice channel if they are in one themselves
      if (message.member.voice.channel) {
        const queryTokens = message.content.split(' ')
        const [media] = bot.mediaManager.getBySearch(queryTokens.slice(1, queryTokens.length).join(' '))
        if (media) {
          const connection = await message.member.voice.channel.join()
          const dispatcher = connection.play(media)
        } else {
          message.reply('Media not found :(')
        }
      } else {
        message.reply('You need to join a voice channel first!')
      }
    } else if (message.content.split(' ').shift() === '/list') {
      list(bot, message)
    } else if (message.content.split(' ').shift() === '/r') {
      if (message.member.voice.channel) {
        const randomIndex = Math.trunc(Math.random() * bot.mediaManager.data.length)
        const media = bot.mediaManager.data[randomIndex]
        const connection = await message.member.voice.channel.join()
        const dispatcher = connection.play(media)
        message.reply(`Playing *${ bot.mediaManager.getFilenameList()[randomIndex] }*`)
      } else {
        message.reply('You need to join a voice channel first!')
      }
    }
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

  await bot.discord.login(process.env.DISCORD_TOKEN)
}

main()
  .then()
  .catch(error => console.error(error))
