import { Client, StageChannel, VoiceChannel } from 'discord.js'
import {
  AutocompleteChoice,
  AutocompleteContext,
  ButtonStyle,
  CommandContext,
  CommandOptionType,
  ComponentContext,
  ComponentType,
  SlashCreator,
} from 'slash-create'
import MediaManager from '../classes/MediaManager'
import playMediaInVoiceChannel from '../utils/playMediaInVoiceChannel'
import EnhancedSlashCommand, { EnhancedSlashCommandOptions } from '../classes/EnhancedSlashCommand'
import Media from '../classes/Media'

export interface SlashCommandOptions {
  sound: string
}

export type PlayCommandOptions = Pick<EnhancedSlashCommandOptions, 'throttling' | 'throttleCache'>

const REPLAY_BUTTON_ID = 'play_cmd_replay_btn'

export default class PlayCommand extends EnhancedSlashCommand {
  constructor(
    creator: SlashCreator,
    protected discord: Client,
    protected mediaManager: MediaManager,
    options?: PlayCommandOptions,
  ) {
    super(creator, {
      name: 'play',
      description: 'Play a sound in your current voice channel',
      throttling: options?.throttling,
      throttleCache: options?.throttleCache,
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

    const memberId = ctx.member!.id
    const guild = await this.discord.guilds.fetch(ctx.guildID!)
    const member = guild.members.resolve(memberId)
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
        .then(() => ctx.registerComponent(
          REPLAY_BUTTON_ID, (btnCtx) => this.replayButtonHandler(btnCtx, voiceChannel, media)),
        )

      this.throttler?.registerUsage(memberId)
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

  async replayButtonHandler(buttonCtx: ComponentContext, voiceChannel: VoiceChannel | StageChannel, media: Media) {
    const memberId = buttonCtx.member!.id

    if (this.throttler?.isThrottled(memberId)) {
      this.onBlock(buttonCtx as any, 'throttling', {
        throttle: this.throttleCache,
        remaining: this.throttler!.getRemainingDuration(memberId)! / 1000,
      })
      return buttonCtx.acknowledge()
    }

    playMediaInVoiceChannel(voiceChannel, media)
    this.throttler?.registerUsage(memberId)

    return buttonCtx.acknowledge()
  }
}
