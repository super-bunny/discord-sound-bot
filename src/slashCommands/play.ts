import {
  AutocompleteChoice,
  AutocompleteContext,
  ButtonStyle,
  CommandOptionType,
  ComponentType,
  SlashCommand,
} from 'slash-create'
import MediaManager from '../classes/MediaManager'
import { Client } from 'discord.js'
import playMediaInVoiceChannel from '../utils/playMediaInVoiceChannel'

export interface Options {
  sound: string
}

const REPLAY_BUTTON_ID = 'play_cmd_replay_btn'

export default class PlayCommand extends SlashCommand {
  constructor(creator, private discord: Client, private mediaManager: MediaManager) {
    super(creator, {
      name: 'play',
      description: 'Play a sound in your current voice channel',
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'sound',
          description: 'Name of the sound to play',
          autocomplete: true,
          required: true,
        },
      ],
    })
  }

  async run(ctx) {
    await ctx.defer(true)

    const guild = await this.discord.guilds.fetch(ctx.guildID)
    const member = guild.members.resolve(ctx.member.id)
    const voiceChannel = member.voice.channel
    const { sound } = ctx.options as Options

    // Check if message author is in voice channel
    if (!voiceChannel) {
      return ctx.send('You need to join a voice channel first!', { ephemeral: true })
    }

    const [media] = this.mediaManager.getBySearch(sound)

    if (media) {
      ctx.send(`Playing \`${ media.name }\``, {
        components: [
          {
            type: ComponentType.ACTION_ROW,
            components: [
              {
                type: ComponentType.BUTTON,
                style: ButtonStyle.SECONDARY,
                label: 'Replay',
                emoji: { name: '🔁' },
                custom_id: REPLAY_BUTTON_ID,
              },
            ],
          },
        ],
      })
        .then(() => ctx.registerComponent(REPLAY_BUTTON_ID, async (btnCtx) => {
          playMediaInVoiceChannel(voiceChannel, media)

          return btnCtx.acknowledge()
        }))

      playMediaInVoiceChannel(voiceChannel, media)
    } else {
      return ctx.send(`No media found for query **${ sound }** :upside_down:`, { ephemeral: true })
    }
  }


  async autocomplete(ctx: AutocompleteContext): Promise<Array<AutocompleteChoice>> {
    const { sound } = ctx.options as Options

    return this.mediaManager.getBySearch(sound)
      .slice(0, 25)
      .map(({ name, filename }): AutocompleteChoice => ({ name, value: filename }))
  }
}
