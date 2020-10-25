import Discord from 'discord.js'

function findChannelByMember(client: Discord.Client, nickname: string): Discord.VoiceChannel {
  const channels = client.channels.cache.array()
    .filter(channel => channel.type === 'voice') as Discord.VoiceChannel[]
  return channels.find(channel =>
    channel.members.find(member => member.nickname === nickname))
}

export function getBotOwner(client: Discord.Client) {
  return client.users.fetch(process.env.DISCORD_OWNER_ID)
}
