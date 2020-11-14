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
  const connection = await message.member.voice.channel.join()
  const dispatcher = connection.play(media)

  return message.reply(`Playing *${ bot.mediaManager.getFilenameList()[randomIndex] }*`)
}
