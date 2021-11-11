import { createAudioPlayer, createAudioResource, joinVoiceChannel } from '@discordjs/voice'

export default async function randomCommand(message, bot) {
  if (!message.guild) {
    return message.reply('Command only available in server')
  }
  // Check if message author is in voice channel
  if (!message.member?.voice.channel) {
    return message.reply('You need to join a voice channel first!')
  }

  const randomIndex = Math.trunc(Math.random() * bot.mediaManager.data.length)
  const media = bot.mediaManager.data[randomIndex]
  const connection = joinVoiceChannel({
    channelId: message.member.voice.channel.id,
    guildId: message.member.voice.guild.id,
    adapterCreator: message.member.voice.guild.voiceAdapterCreator,
    selfMute: false,
  })
  const player = createAudioPlayer()
  connection.subscribe(player)
  player.play(createAudioResource(media.filepath))

  return message.reply(`Playing *${ bot.mediaManager.filenameList[randomIndex] }*`)
}
