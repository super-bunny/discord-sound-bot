require('dotenv').config()
import * as env from 'env-var'
import * as Discord from 'discord.js'
import MediaManager from './classes/MediaManager'

env.get('MEDIA_FOLDER').required().asString()
env.get('DISCORD_TOKEN').required().asString()
env.get('DISCORD_ROLE_NAME').required().asString()

async function main() {
  const client = new Discord.Client()
  const mediaManager = await MediaManager.init(process.env.MEDIA_FOLDER)

  client.on('ready', () => {
    console.log('Discord bot ready!')
  })

  client.on('message', async message => {
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
        const [media] = mediaManager.getBySearch(queryTokens.slice(1, queryTokens.length).join(' '))
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
      message.reply('```' + mediaManager.getFilenameList().join('\n') + '```')
    } else if (message.content.split(' ').shift() === '/r') {
      if (message.member.voice.channel) {
        const randomIndex = Math.trunc(Math.random() * mediaManager.data.length)
        const media = mediaManager.data[randomIndex]
        const connection = await message.member.voice.channel.join()
        const dispatcher = connection.play(media)
      } else {
        message.reply('You need to join a voice channel first!')
      }
    }
  })

  await client.login(process.env.DISCORD_TOKEN)
}

main()
  .then()
  .catch(error => console.error(error))
