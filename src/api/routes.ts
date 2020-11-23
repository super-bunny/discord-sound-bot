import { responseWrapper } from './ApiUtils'
import Bot from '../classes/Bot'
import { getMemberVoiceChannel } from '../utils'
import { ApiConfig } from '../types'

export default function (app, bot: Bot, config: ApiConfig) {
  app.get('/', async (req, res) => {
    res.json(responseWrapper('Hello World!'))
  })

  app.get('/sounds', async (req, res) => {
    const mediaList = bot.mediaManager.getFilenameList()
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
    const channel = getMemberVoiceChannel(bot.discord,
      member => member.user.id === token.discordMemberId)
    if (!channel) {
      res.status(404).json(responseWrapper(null, 400, 'Member not connected'))
      return
    }
    const connection = await channel.join()
    const dispatcher = connection.play(media.filepath)

    res.json(responseWrapper(media.name))
  })

  app.post('/random', async (req, res) => {
    const token = config.tokens.find(token => token.token === req.headers.authorization)
    const channel = getMemberVoiceChannel(bot.discord,
      member => member.user.id === token.discordMemberId)
    if (!channel) {
      res.status(404).json(responseWrapper(null, 400, 'Member not connected'))
      return
    }
    const media = bot.mediaManager.getRandomMedia()
    const connection = await channel.join()
    const dispatcher = connection.play(media.filepath)

    res.json(responseWrapper(media.name))
  })
}
