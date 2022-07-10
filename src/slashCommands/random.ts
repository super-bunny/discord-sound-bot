import { Client, StageChannel, VoiceChannel } from 'discord.js'
import { ButtonStyle, CommandContext, ComponentContext, ComponentType, SlashCreator } from 'slash-create'
import MediaManager from '../classes/MediaManager'
import playMediaInVoiceChannel from '../utils/playMediaInVoiceChannel'
import EnhancedSlashCommand, { EnhancedSlashCommandOptions } from '../classes/EnhancedSlashCommand'
import Media from '../classes/Media'

export type RandomCommandOptions = Pick<EnhancedSlashCommandOptions, 'throttling' | 'throttleCache'>

const REPLAY_BUTTON_ID = 'random_cmd_replay_btn'

export default class RandomCommand extends EnhancedSlashCommand {
  constructor(
    creator: SlashCreator,
    private discord: Client,
    private mediaManager: MediaManager,
    options?: RandomCommandOptions,
  ) {
    super(creator, {
      name: 'random',
      description: 'Play a random sound in your current voice channel',
      throttling: options?.throttling,
      throttleCache: options?.throttleCache,
    })
  }

  async run(ctx: CommandContext) {
    await ctx.defer(true)

    const memberId = ctx.member!.id
    const guild = await this.discord.guilds.fetch(ctx.guildID!)
    const member = guild.members.resolve(ctx.member!.id)
    const voiceChannel = member!.voice.channel

    // Check if message author is in voice channel
    if (!voiceChannel) {
      return ctx.send('You need to join a voice channel first!', { ephemeral: true })
    }

    const media = this.mediaManager.getRandomMedia()

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
