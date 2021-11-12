import { ButtonStyle, CommandOptionType, ComponentType, SlashCommand } from 'slash-create'
import MediaManager from '../classes/MediaManager'
import Config from '../classes/Config'

export interface Options {
  page?: number
}

const PREVIOUS_PAGE_BUTTON_ID = 'list_cmd_previous_page_btn'
const NEXT_PAGE_BUTTON_ID = 'list_cmd_next_page_btn'

export default class ListCommand extends SlashCommand {
  constructor(creator, private mediaManager: MediaManager, private config: Config) {
    super(creator, {
      name: 'list',
      description: 'List all available sounds',
      options: [
        {
          type: CommandOptionType.INTEGER,
          name: 'page',
          description: 'Page number of sound list',
          required: false,
        },
      ],
    })
  }

  get pageSize(): number {
    return this.config.app.listPageSize
  }

  get pageCount(): number {
    return Math.ceil(this.mediaManager.medias.length / this.pageSize)
  }

  // Get message to respond to the List command
  private getMessage(page: number) {
    const mediaNameList = this.mediaManager.mediaNameList
    const computedPage = page > this.pageCount ? this.pageCount : Math.max(0, (page - 1))

    return [
      `${ this.pageSize } of ${ mediaNameList.length } sound(s), page ${ computedPage + 1 }/${ this.pageCount }`,
      ListCommand.getFormattedList(mediaNameList, this.pageSize * computedPage, this.pageSize),
    ].join('\n')
  }

  async run(ctx) {
    const { page = 1 } = ctx.options as Options

    await ctx.defer(true)

    await ctx.send(this.getMessage(page), {
      ephemeral: true,
      components: [
        {
          type: ComponentType.ACTION_ROW,
          components: [
            {
              type: ComponentType.BUTTON,
              style: ButtonStyle.PRIMARY,
              label: 'Previous page',
              custom_id: PREVIOUS_PAGE_BUTTON_ID,
            },
            {
              type: ComponentType.BUTTON,
              style: ButtonStyle.PRIMARY,
              label: 'Next page',
              custom_id: NEXT_PAGE_BUTTON_ID,
            },
          ],
        },
      ],
    })

    ctx.registerComponent(PREVIOUS_PAGE_BUTTON_ID, async (btnCtx) => {
      const currentPage = ListCommand.getPageFromMessage(btnCtx.message.content)
      await btnCtx.editParent(this.getMessage(currentPage > 1 ? currentPage - 1 : this.pageCount))
      return btnCtx.acknowledge()
    })
    ctx.registerComponent(NEXT_PAGE_BUTTON_ID, async (btnCtx) => {
      const currentPage = ListCommand.getPageFromMessage(btnCtx.message.content)
      await btnCtx.editParent(this.getMessage(currentPage < this.pageCount ? currentPage + 1 : 1))
      return btnCtx.acknowledge()
    })
  }

  // Return a formatted list slice for List command message
  static getFormattedList(list: Array<string>, offset: number, pageSize: number) {
    const listStr = list
      .slice(offset, offset + pageSize)
      .map((mediaName, index) => `${ offset + index + 1 } ${ mediaName }`)
      .join('\n')

    return '```' + listStr + '```'
  }

  // Retrieve page number from a List command message
  static getPageFromMessage(message: string): number {
    const firstLine = message.split('\n')[0]
    const pageStr = firstLine.split(' ').pop().split('/')[0]

    return parseInt(pageStr)
  }
}
