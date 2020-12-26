import { Message } from 'discord.js'
import Bot from '../classes/Bot'

const NEXT_EMOJI = '➡'
const PREVIOUS_EMOJI = '⬅'
const DELETE_EMOJI = '🗑'

function getListMessagePage(message: Message): number | null {
  const [_, pageString] = (/Page ([\d]+)\/([\d]+)/g).exec(message.content)
  return Number(pageString) - 1 || null
}

function getFormattedList(list: Array<string>, offset: number, pageSize: number) {
  const listStr = list
    .map((item, index) => `${ index + 1 } ${ item }`)
    .slice(offset, offset + pageSize)
    .join('\n')
  return '```' + listStr + '```'
}

function createListMessage(bot: Bot, requestedPage: number, showReactionMsg?: boolean): string {
  const filenameList = bot.mediaManager.filenameList
  const pageSize = bot.config.app.listPageSize
  const pageCount = Math.trunc(filenameList.length / pageSize)
  const page = requestedPage > pageCount ? pageCount : Math.max(0, requestedPage)

  return [
    'Sound list :',
    getFormattedList(filenameList, pageSize * page, pageSize),
    `*Page ${ page + 1 }/${ pageCount + 1 }*`,
    `*${ pageSize } of ${ filenameList.length } sound(s)*`,
    'Usage : `/list <page_number>`',
    showReactionMsg && '*Use reactions below to navigate between pages or delete this message*',
  ].join('\n')
}

export default function listCommand(message: Message, bot: Bot) {
  const pageParameter = Number(message.content.split(' ')[1]) - 1 || 0
  const listMessage = createListMessage(bot, pageParameter, true)

  message.reply(listMessage)
    .then(async (replyMessage) => {
      const collector = replyMessage.createReactionCollector(
        (reaction, user) => {
          const filteredEmoji = [PREVIOUS_EMOJI, NEXT_EMOJI, DELETE_EMOJI]
          return filteredEmoji.includes(reaction.emoji.name) && user.id === message.author.id
        },
        { time: 120000 },
      )

      collector.on('collect', async (reaction, user) => {
        const page = getListMessagePage(reaction.message)

        collector.resetTimer()
        switch (reaction.emoji.name) {
          case PREVIOUS_EMOJI:
            if (page > 0) {
              const mention = reaction.message.content.split('\n')[0].split(',')[0]
              await reaction.message.edit(mention + ', ' + createListMessage(bot, page - 1, true))
            }
            break
          case NEXT_EMOJI:
            const mention = reaction.message.content.split('\n')[0].split(',')[0]
            await reaction.message.edit(mention + ', ' + createListMessage(bot, page + 1, true))
            break
          case DELETE_EMOJI:
            if (bot.config.app.listDeleteOriginMessage) {
              // Promise is ignored to speed up process
              message.delete()
            }
            return reaction.message.delete()
        }
        return reaction.users.remove(user.id)
      })

      collector.on('end', () => {
        if (replyMessage.deleted) {
          return
        }
        // Remove reaction tip line from message
        replyMessage.edit(replyMessage.content
          .split('\n')
          .slice(0, -1)
          .join('\n'))
        replyMessage.reactions.removeAll()
      })

      await replyMessage.react(PREVIOUS_EMOJI)
      await replyMessage.react(NEXT_EMOJI)
      await replyMessage.react(DELETE_EMOJI)
    })
}
