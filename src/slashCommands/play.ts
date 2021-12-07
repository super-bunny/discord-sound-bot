import { Client } from 'discord.js'
import {
  AutocompleteChoice,
  AutocompleteContext,
  ButtonStyle,
  CommandContext,
  CommandOptionType,
  ComponentType,
  SlashCommand,
  SlashCreator,
} from 'slash-create'
import MediaManager from '../classes/MediaManager'
import playMediaInVoiceChannel from '../utils/playMediaInVoiceChannel'

export interface Options {
  // Optional alternative command name, default to "play" (useful for command alias)
  commandName?: string
  // Optional alternative command description (useful for command alias)
  commandDescription?: string
}

export interface SlashCommandOptions {
  sound: string
}

const REPLAY_BUTTON_ID = 'play_cmd_replay_btn'

export default class PlayCommand extends SlashCommand {
  constructor(
    creator: SlashCreator,
    protected discord: Client,
    protected mediaManager: MediaManager,
    options?: Options,
  ) {
    super(creator, {
      name: options?.commandName ?? 'play',
      description: options?.commandDescription ?? 'Play a sound in your current voice channel',
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

  async run(ctx: CommandContext) {
    await ctx.defer(true)

    const guild = await this.discord.guilds.fetch(ctx.guildID!)
    const member = guild.members.resolve(ctx.member!.id)
    const voiceChannel = member!.voice.channel
    const { sound } = ctx.options as SlashCommandOptions

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
    const { sound } = ctx.options as SlashCommandOptions

    return this.mediaManager.getBySearch(sound)
      .slice(0, 25)
      .map(({ name, filename }): AutocompleteChoice => ({ name, value: filename }))
  }
}
