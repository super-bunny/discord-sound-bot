import { Client } from 'discord.js'
import { SlashCreator } from 'slash-create'
import MediaManager from '../../classes/MediaManager'
import PlayCommand from '../play'

export default class PCommand extends PlayCommand {
  constructor(creator: SlashCreator, discord: Client, mediaManager: MediaManager) {
    super(creator, discord, mediaManager, {
      commandName: 'p',
      commandDescription: 'Alias for play command',
    })
  }
}
