import { Application, Response } from 'express'
import { createReadStream } from 'fs'
import { ResponseLocals } from '../api.js'
import Bot from '../classes/Bot.js'
import getUserVoiceChannel from '../utils/getUserVoiceChannel.js'
import { responseWrapper } from './ApiUtils.js'
import { ApiConfig } from '../types/Config.js'
import playMediaInVoiceChannel from '../utils/playMediaInVoiceChannel.js'

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

    const commandThrottler = bot.cache.throttles.play
    if (commandThrottler?.isThrottled(tokenData.discordMemberId)) {
      res.status(429).json(responseWrapper(null, 404,
        `Member is throttled for ${ commandThrottler?.getRemainingDuration(tokenData.discordMemberId)! / 1000 }s`))
      return
    }

    commandThrottler?.registerUsage(tokenData.discordMemberId)

    playMediaInVoiceChannel(channel, media)

    res.json(responseWrapper(media.name))
  })

  app.post('/random', async (req, res: Response<any, ResponseLocals>) => {
    const tokenData = res.locals.tokenData!

    const channel = getUserVoiceChannel(bot.discord, tokenData.discordMemberId)

    if (!channel) {
      res.status(404).json(responseWrapper(null, 404, 'Member not connected'))
      return
    }

    const commandThrottler = bot.cache.throttles.random
    if (commandThrottler?.isThrottled(tokenData.discordMemberId)) {
      res.status(429).json(responseWrapper(null, 404,
        `Member is throttled for ${ commandThrottler?.getRemainingDuration(tokenData.discordMemberId)! / 1000 }s`))
      return
    }

    commandThrottler?.registerUsage(tokenData.discordMemberId)

    const media = bot.mediaManager.getRandomMedia()
    playMediaInVoiceChannel(channel, media)

    res.json(responseWrapper(media.name))
  })
}
