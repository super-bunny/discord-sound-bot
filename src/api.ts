import express from 'express'
import routes from './api/routes'
import bodyParser from 'body-parser'
import cors from 'cors'
import Bot from './classes/Bot'
import { ApiConfig } from './types'

export async function start(bot: Bot, config: ApiConfig) {
  const app: express.Application = express()
  const port = process.env.API_PORT || 3000

  app.use(cors())
  app.use(bodyParser.json())

  // Authentication middleware
  app.use(function (req, res, next) {
    const authorization = req.headers.authorization
    if (!authorization) {
      return res.status(401).json({ error: 'No token sent' })
    }
    if (!config.tokens.find(token => token.token === authorization)) {
      return res.status(401).json({ error: 'Token not authorized' })
    }
    next()
  })

  // Register routes
  routes(app, bot, config)

  app.listen(port, function () {
    console.log(`API is listening on port ${ port }!`)
  })

  return app
}

export default {
  start,
}
