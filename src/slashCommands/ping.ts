import { CommandContext, SlashCommand, SlashCreator } from 'slash-create'

export default class PingCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'ping',
      description: 'Ping Pong',
    })
  }

  async run(ctx: CommandContext) {
    return 'pong'
  }
}
