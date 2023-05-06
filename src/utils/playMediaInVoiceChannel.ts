import { StageChannel, VoiceChannel } from 'discord.js'
import { createAudioPlayer, createAudioResource, joinVoiceChannel } from '@discordjs/voice'
import Media from '../classes/Media.js'

export default function playMediaInVoiceChannel(voiceChannel: VoiceChannel | StageChannel, media: Media): void {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guildId,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
  })

  const player = createAudioPlayer()

  connection.subscribe(player)
  player.play(createAudioResource(media.filepath))
}
