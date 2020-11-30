import * as fs from 'fs'
import * as path from 'path'
import Fuse from 'fuse.js'

export default class MediaManager {
  readonly mediaFolderPath: string
  data: Media[]

  constructor(mediaFolderPath: string) {
    this.mediaFolderPath = mediaFolderPath
  }

  get filePathList(): string[] {
    return this.data.map(media => media.filepath)
  }

  getRandomMedia(): Media {
    const randomIndex = Math.trunc(Math.random() * this.data.length)

    return this.data[randomIndex]
  }

  getBySearch(query: string): Array<Media & { score: number }> {
    const fuse = new Fuse(this.data, { keys: ['name'], includeScore: true })
    const results = fuse.search(query)

    return results.map(result => ({
      ...result.item,
      score: result.score,
    }))
  }

  getFilenameList(): string[] {
    return this.data.map(media => media.name)
  }

  async refresh(): Promise<MediaManager> {
    return fs.promises.readdir(this.mediaFolderPath)
      .then(files => files.map(filename => ({
        name: filename,
        filepath: path.resolve(this.mediaFolderPath, filename),
      })))
      .then(medias => {
        this.data = medias
        return this
      })
  }

  static async init(mediaFolderPath): Promise<MediaManager> {
    return new MediaManager(mediaFolderPath)
      .refresh()
  }
}

type Media = { name: string, filepath: string }
