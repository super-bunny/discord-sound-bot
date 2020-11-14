import express from 'express'
import routes from './api/routes'
import bodyParser from 'body-parser'
import Bot from './classes/Bot'
import { ApiConfig } from './types'

export async function start(bot: Bot, config: ApiConfig) {
  const app: express.Application = express()

  app.use(bodyParser.json())

  // Authentication middleware
  app.use(function (req, res, next) {
    const authorization = req.headers.authorization
    if (!authorization) {
      return res.status(403).json({ error: 'No token sent' })
    }
    if (!config.tokens.find(token => token.token === authorization)) {
      return res.status(403).json({ error: 'Token not authorized' })
    }
    next()
  })

  // Register routes
  routes(app, bot, config)

  app.listen(3000, function () {
    console.log('API is listening on port 3000!')
  })

  return app
}

export default {
  start,
}