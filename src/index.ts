import { getVoiceConnection } from '@discordjs/voice'
import chokidar from 'chokidar'
import env from 'env-var'
import fs from 'fs'
import { GatewayServer, SlashCreator } from 'slash-create'
import Bot from './classes/Bot.js'
import Config from './classes/Config.js'
import ListCommand from './slashCommands/list.js'
import PingCommand from './slashCommands/ping.js'
import PlayCommand from './slashCommands/play.js'
import RandomCommand from './slashCommands/random.js'
import SearchCommand from './slashCommands/search.js'
import TokenCommand from './slashCommands/token.js'
import renameMediaFile from './utils/renameMediaFile.js'
import printAppEnv from './utils/printAppEnv.js'
import { GatewayDispatchEvents } from 'discord-api-types/v10'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
  printAppEnv()

  const config = await Config.init(env.get('CONFIG_FILE').asString() || './config.json')

  const bot = await Bot.start(config)

  const creator = new SlashCreator({
    applicationID: env.get('DISCORD_APP_ID').required().asString(),
    publicKey: env.get('DISCORD_PUBLIC_KEY').required().asString(),
    token: env.get('DISCORD_TOKEN').required().asString(),
  })
  creator
    .withServer(new GatewayServer(
      (handler) => bot.discord.ws.on(GatewayDispatchEvents.IntegrationCreate, handler),
    ))
    .registerCommands([
      new PingCommand(creator),
      new PlayCommand(creator, bot.discord, bot.mediaManager, {
        throttling: config.data.app.commandThrottling?.play,
        throttleCache: bot.cache.throttles.play?.cache,
      }),
      new RandomCommand(creator, bot.discord, bot.mediaManager, {
        throttling: config.data.app.commandThrottling?.random,
        throttleCache: bot.cache.throttles.random?.cache,
      }),
      new SearchCommand(creator, bot.mediaManager),
      new ListCommand(creator, bot.mediaManager, config),
      new TokenCommand(creator, config),
    ])
    .syncCommands({ deleteCommands: true }) // Sync slash commands with Discord API
    .on('debug', (message) => console.log(message))
    .on('warn', (message) => console.warn(message))
    .on('error', (error) => console.error(error))
    .on('synced', () => console.info('Commands synced!'))
    .on('commandRun', (command, _, ctx) =>
      console.info(`${ ctx.user.username }#${ ctx.user.discriminator } (${ ctx.user.id }) ran command ${ command.commandName }`))
    .on('commandRegister', (command) =>
      console.info(`Registered command ${ command.commandName }`))
    .on('commandError', (command, error) => console.error(`Command ${ command.commandName }:`, error))

  // Sync global slash commands with Discord API
  creator.syncGlobalCommands(true)
    .then(() => console.info('Global commands synced!'))
    .catch(error => console.error('Fail to sync global commands: ', error.message))

  const watcher = chokidar.watch(env.get('MEDIA_FOLDER').required().asString(), {
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
      if (connection && oldMember.channel?.members.every(member => member.user.bot)) {
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
