import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { CookieOptions, Response } from 'express'
import routes from './api/routes'
import Bot from './classes/Bot'
import { ApiConfig, ApiConfigToken } from './classes/Config'

export interface ResponseLocals {
  tokenData?: ApiConfigToken
}

const AUTH_COOKIE_NAME = 'token'
const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV?.toUpperCase() !== 'DEVELOPMENT',
  sameSite: 'strict',
  maxAge: 2 * 60 * 60 * 1000, /* 2h */
}

export async function start(bot: Bot, config: ApiConfig) {
  const app: express.Application = express()
  const port = process.env.API_PORT || 3000

  app.use(cors())
  app.use(cookieParser())
  app.use(bodyParser.json())

  // Authentication middleware (cookie)
  app.use(function (req, res: Response<any, ResponseLocals>, next) {
    const token = req.cookies.token

    if (!token) {
      return next()
    }

    const tokenData = config.tokens.find(tokenData => tokenData.token === token)

    if (!tokenData) {
      res.clearCookie(AUTH_COOKIE_NAME)
      return next()
    }

    res.locals.tokenData = tokenData // Keeps token in local request for next uses

    next()
  })


  // Authentication middleware
  app.use(function (req, res: Response<any, ResponseLocals>, next) {
    // Skip if already authenticated (by cookie)
    if (res.locals.tokenData) {
      return next()
    }

    const authorization = req.headers.authorization
    if (!authorization) {
      return res.status(401).json({ error: 'No token sent' })
    }

    const tokenData = config.tokens.find(token => token.token === authorization)

    if (!tokenData) {
      return res.status(401).json({ error: 'Token not authorized' })
    }

    res.locals.tokenData = tokenData // Keeps token in local request for next uses

    // Set auth cookie
    res.cookie(AUTH_COOKIE_NAME, tokenData.token, AUTH_COOKIE_OPTIONS)

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
