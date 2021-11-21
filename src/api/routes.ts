import { responseWrapper } from './ApiUtils'
import Bot from '../classes/Bot'
import { ApiConfig } from '../classes/Config'
import { createAudioPlayer, createAudioResource, joinVoiceChannel } from '@discordjs/voice'
import getUserVoiceChannel from '../utils/getUserVoiceChannel'

export default function (app, bot: Bot, config: ApiConfig) {
  app.get('/', async (req, res) => {
    res.json(responseWrapper('Hello World!'))
  })

  app.get('/sounds', async (req, res) => {
    const search = req.query.search

    if (search) {
      const mediaList = bot.mediaManager.getBySearch(search).map(media => media.name)
      res.json(responseWrapper(mediaList))
      return
    }

    const mediaList = bot.mediaManager.mediaNameList
    res.json(responseWrapper(mediaList))
  })

  app.post('/play', async (req, res) => {
    const mediaName = req.body.name

    if (!mediaName) {
      res.status(400).json(responseWrapper(null, 400, 'Missing name in body'))
      return
    }
    const [media] = bot.mediaManager.getBySearch(mediaName)
    if (!media) {
      res.status(404).json(responseWrapper(null, 400, 'Media not found'))
      return
    }
    const token = config.tokens.find(token => token.token === req.headers.authorization)
    const channel = getUserVoiceChannel(bot.discord, token.discordMemberId)
    if (!channel) {
      res.status(404).json(responseWrapper(null, 400, 'Member not connected'))
      return
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    })
    const player = createAudioPlayer()
    connection.subscribe(player)
    player.play(createAudioResource(media.filepath))

    res.json(responseWrapper(media.name))
  })

  app.post('/random', async (req, res) => {
    const token = config.tokens.find(token => token.token === req.headers.authorization)
    const channel = getUserVoiceChannel(bot.discord, token.discordMemberId)
    if (!channel) {
      res.status(404).json(responseWrapper(null, 400, 'Member not connected'))
      return
    }

    const media = bot.mediaManager.getRandomMedia()
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    })
    const player = createAudioPlayer()
    connection.subscribe(player)
    player.play(createAudioResource(media.filepath))

    res.json(responseWrapper(media.name))
  })
}
