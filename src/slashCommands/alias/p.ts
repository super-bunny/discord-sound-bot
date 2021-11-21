import MediaManager from '../../classes/MediaManager'
import { Client } from 'discord.js'
import PlayCommand from '../play'

export default class PCommand extends PlayCommand {
  constructor(creator, discord: Client, mediaManager: MediaManager) {
    super(creator, discord, mediaManager, {
      commandName: 'p',
      commandDescription: 'Alias for play command',
    })
  }
}
