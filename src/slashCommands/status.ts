import { CommandContext, SlashCommand, SlashCreator } from 'slash-create'
import moment from 'moment'
import pkg from '../../package.json' assert { type: 'json' }

export default class StatusCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'status',
      description: 'Get status of the bot (version, uptime...)',
    })
  }

  async run(ctx: CommandContext) {
    const { version } = pkg

    const message = [
      `v${ version }`,
      `Up since ${ moment.duration({ second: process.uptime() }).humanize() }`,
    ].join('\n')

    return ctx.send(message, { ephemeral: true })
  }
}
