import { CommandOptionType, SlashCommand } from 'slash-create'
import MediaManager from '../classes/MediaManager'

export interface Options {
  query: string
}

export default class SearchCommand extends SlashCommand {
  constructor(creator, private mediaManager: MediaManager) {
    super(creator, {
      name: 'search',
      description: 'Search a sound (show 5 best results)',
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'query',
          description: 'Query to search sound',
          required: true,
        },
      ],
    })
  }

  async run(ctx) {
    const { query } = ctx.options as Options

    const mediaSearchResults = this.mediaManager.getBySearch(query)
      .slice(0, 5)

    if (mediaSearchResults.length) {
      const message = [
        `Search results for **${ query }** :`,
        '```',
        ...mediaSearchResults
          .map((media, index) =>
            `${ index + 1 }. ${ media.name } (${ Math.trunc((1 - media.score) * 100) }%)`,
          ),
        '```',
      ].join('\n')

      return ctx.send(message, { ephemeral: true })
    } else {
      return ctx.send(`No result found for query **${ query }** :upside_down:`, { ephemeral: true })
    }
  }
}
