import Discord, { GuildMember } from 'discord.js'
import Path from 'path'
import Bot from './classes/Bot'

export function getMemberVoiceChannel(client: Discord.Client, filter: (member: GuildMember) => boolean): Discord.VoiceChannel {
  const channels = client.channels.cache.array()
    .filter(channel => channel.type === 'voice') as Discord.VoiceChannel[]
  return channels.find(channel => channel.members.find(filter))
}

export function getBotOwner(bot: Bot) {
  return bot.discord.users.fetch(bot.config.app.ownerDiscordId)
}

export function renameMediaFile(path: string) {
  const parsedPath = Path.parse(path)
  const newName = parsedPath.name
    .replace(/[- _]+/g, '_')
    .toLowerCase()

  return `${ parsedPath.dir }/${ newName }${ parsedPath.ext.toLowerCase() }`
}
