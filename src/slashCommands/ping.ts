import { SlashCommand } from 'slash-create'

export default class PingCommand extends SlashCommand {
  constructor(creator) {
    super(creator, {
      name: 'ping',
      description: 'Ping Pong',
    })
  }

  async run(ctx) {
    return 'pong'
  }
}
