import { CommandContext, SlashCommand, SlashCreator } from 'slash-create'
import Config from '../classes/Config'

export default class TokenCommand extends SlashCommand {
  constructor(creator: SlashCreator, private config: Config) {
    super(creator, {
      name: 'token',
      description: 'Get your api token if you have an access',
    })
  }

  async run(ctx: CommandContext) {
    const userId = ctx.user.id
    const userConfig = this.config.data.api.tokens
      .find(token => token.discordMemberId === userId)

    if (!userConfig) {
      return ctx.send('You do not have access to the API :upside_down:', { ephemeral: true })
    }

    return ctx.send(`Your token is \`${ userConfig.token }\``, { ephemeral: true })
  }
}
