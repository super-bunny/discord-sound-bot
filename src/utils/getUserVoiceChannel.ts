import { Client, Guild, StageChannel, User, VoiceChannel } from 'discord.js'

export default function getUserVoiceChannel(client: Client, userId: User['id']): VoiceChannel | StageChannel | null {
  const guild: Guild | undefined = client.guilds.cache.find(guild => !!guild.members.resolve(userId)?.voice.channel)
  const user = guild ? guild.members.resolve(userId) : null

  return user?.voice.channel ?? null
}
