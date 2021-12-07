import { Client } from 'discord.js'
import { ButtonStyle, CommandContext, ComponentType, SlashCommand, SlashCreator } from 'slash-create'
import MediaManager from '../classes/MediaManager'
import playMediaInVoiceChannel from '../utils/playMediaInVoiceChannel'

const REPLAY_BUTTON_ID = 'random_cmd_replay_btn'

export default class RandomCommand extends SlashCommand {
  constructor(creator: SlashCreator, private discord: Client, private mediaManager: MediaManager) {
    super(creator, {
      name: 'random',
      description: 'Play a random sound in your current voice channel',
    })
  }

  async run(ctx: CommandContext) {
    await ctx.defer(true)

    const guild = await this.discord.guilds.fetch(ctx.guildID!)
    const member = guild.members.resolve(ctx.member!.id)
    const voiceChannel = member!.voice.channel

    // Check if message author is in voice channel
    if (!voiceChannel) {
      return 'You need to join a voice channel first!'
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
      .then(() => {
        ctx.registerComponent(REPLAY_BUTTON_ID, async (btnCtx) => {
          playMediaInVoiceChannel(voiceChannel, media)

          return btnCtx.acknowledge()
        })
      })

    playMediaInVoiceChannel(voiceChannel, media)
  }
}
