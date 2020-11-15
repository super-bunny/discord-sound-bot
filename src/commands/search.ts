import { Message } from 'discord.js'
import Bot from '../classes/Bot'

export default async function searchCommand(message: Message, bot: Bot) {
  const messageTokens = message.content.split(' ')
  const query = messageTokens.slice(1, messageTokens.length).join(' ')
  const mediaSearchResults = bot.mediaManager.getBySearch(query)
    .slice(0, 5)

  if (mediaSearchResults.length) {
    return message.reply(
      [
        `Search results for **${ query }** :`,
        '```',
        ...mediaSearchResults
          .map((media, index) =>
            `${ index + 1 }. ${ media.name } (${ Math.trunc((1 - media.score) * 100) }%)`,
          ),
        '```',
      ].join('\n'),
    )
  } else {
    return message.reply('No media found :upside_down:')
  }
}
