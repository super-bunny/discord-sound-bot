import { createAudioPlayer, createAudioResource, joinVoiceChannel } from '@discordjs/voice'
import { Application, Response } from 'express'
import { createReadStream } from 'fs'
import { ResponseLocals } from '../api.js'
import Bot from '../classes/Bot'
import { ApiConfig } from '../classes/Config'
import getUserVoiceChannel from '../utils/getUserVoiceChannel'
import { responseWrapper } from './ApiUtils'

export default function (app: Application, bot: Bot, config: ApiConfig) {
  app.get('/', async (req, res) => {
    res.json(responseWrapper('Hello World!'))
  })

  app.get('/sounds', async (req, res: Response<any, ResponseLocals>) => {
    const search = req.query.search

    if (typeof search === 'string') {
      const mediaList = bot.mediaManager.getBySearch(search).map(media => media.name)
      res.json(responseWrapper(mediaList))
      return
    }

    const mediaList = bot.mediaManager.mediaNameList
    res.json(responseWrapper(mediaList))
  })


  app.get('/stream/:soundName', async (req, res: Response<any, ResponseLocals>) => {
    const soundName = req.params.soundName

    const media = bot.mediaManager.medias.find(media => media.name === soundName)

    if (!media) {
      return res.status(404).json(responseWrapper(null, 404, 'Media not found'))
    }

    return createReadStream(media.filepath).pipe(res)
  })

  app.post('/play', async (req, res: Response<any, ResponseLocals>) => {
    const mediaName = req.body.name

    if (!mediaName) {
      res.status(400).json(responseWrapper(null, 400, 'Missing name in body'))
      return
    }

    const [media] = bot.mediaManager.getBySearch(mediaName)

    if (!media) {
      res.status(404).json(responseWrapper(null, 404, 'Media not found'))
      return
    }

    const tokenData = res.locals.tokenData!

    const channel = getUserVoiceChannel(bot.discord, tokenData.discordMemberId)

    if (!channel) {
      res.status(404).json(responseWrapper(null, 404, 'Member not connected'))
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

  app.post('/random', async (req, res: Response<any, ResponseLocals>) => {
    const tokenData = res.locals.tokenData!

    const channel = getUserVoiceChannel(bot.discord, tokenData.discordMemberId)

    if (!channel) {
      res.status(404).json(responseWrapper(null, 404, 'Member not connected'))
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
