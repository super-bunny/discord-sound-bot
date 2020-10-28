import Discord, { GuildMember } from 'discord.js'

export function getMemberVoiceChannel(client: Discord.Client, filter: (member: GuildMember) => boolean): Discord.VoiceChannel {
  const channels = client.channels.cache.array()
    .filter(channel => channel.type === 'voice') as Discord.VoiceChannel[]
  return channels.find(channel => channel.members.find(filter))
}

export function getBotOwner(client: Discord.Client) {
  return client.users.fetch(process.env.DISCORD_OWNER_ID)
}
