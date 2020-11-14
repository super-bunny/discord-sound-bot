import { Message } from 'discord.js'
import Bot from '../classes/Bot'

function getFormattedList(list: Array<string>, offset: number, pageSize: number) {
  const listStr = list
    .map((item, index) => `${ index + 1 } ${ item }`)
    .slice(offset, offset + pageSize)
    .join('\n')
  return '```' + listStr + '```'
}

export default function listCommand(message: Message, bot: Bot) {
  const filenameList = bot.mediaManager.getFilenameList()
  const pageParameter = Math.max(0, Number(message.content.split(' ')[1]) - 1) || 0
  const pageSize = bot.config.listPageSize
  const pageCount = Math.trunc(filenameList.length / pageSize)
  const page = pageParameter > pageCount ? pageCount : pageParameter

  const listMessage = [
    'Sound list :',
    getFormattedList(filenameList, pageSize * page, pageSize),
    `*Page ${ page + 1 }/${ pageCount + 1 }*`,
    `*${ pageSize } of ${ filenameList.length } sound(s)*`,
    'Usage : `/list <page_number>`',
  ].join('\n')

  message.reply(listMessage)
}
