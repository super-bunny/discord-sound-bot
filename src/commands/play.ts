import { Message } from 'discord.js'
import Bot from '../classes/Bot'

export default async function playCommand(message: Message, bot: Bot) {
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
}
