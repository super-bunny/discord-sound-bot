require('dotenv').config()
import * as env from 'env-var'

env.get('MEDIA_FOLDER').required().asString()
env.get('DISCORD_TOKEN').required().asString()
