import { ButtonStyle, ComponentType, SlashCommand } from 'slash-create'
import MediaManager from '../classes/MediaManager'
import { createAudioPlayer, createAudioResource, joinVoiceChannel } from '@discordjs/voice'
import { Client } from 'discord.js'

const REPLAY_BUTTON_ID = 'random_cmd_replay_btn'

export default class RandomCommand extends SlashCommand {
  constructor(creator, private discord: Client, private mediaManager: MediaManager) {
    super(creator, {
      name: 'random',
      description: 'Play a random sound in your current voice channel',
    })
  }

  async run(ctx) {
    await ctx.defer(true)

    const guild = await this.discord.guilds.fetch(ctx.guildID)
    const member = guild.members.resolve(ctx.member.id)
    const voiceChannel = member.voice.channel

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
      .then(() => ctx.registerComponent(REPLAY_BUTTON_ID, async (btnCtx) => {
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: ctx.guildID,
          adapterCreator: guild.voiceAdapterCreator,
        })
        const player = createAudioPlayer()

        connection.subscribe(player)
        player.play(createAudioResource(media.filepath))

        return btnCtx.acknowledge()
      }))

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: ctx.guildID,
      adapterCreator: guild.voiceAdapterCreator,
    })
    const player = createAudioPlayer()

    connection.subscribe(player)
    player.play(createAudioResource(media.filepath))
  }
}
