import * as fs from 'fs'
import * as path from 'path'
import Fuse from 'fuse.js'
import Media from './Media'

export default class MediaManager {
  readonly mediaFolderPath: string
  medias: Media[]

  constructor(mediaFolderPath: string) {
    this.mediaFolderPath = mediaFolderPath
  }

  get mediaNameList(): string[] {
    return this.medias.map(media => media.name)
  }

  get filenameList(): string[] {
    return this.medias.map(media => media.filename)
  }

  get filePathList(): string[] {
    return this.medias.map(media => media.filepath)
  }

  getRandomMedia(): Media {
    const randomIndex = Math.trunc(Math.random() * this.medias.length)

    return this.medias[randomIndex]
  }

  getBySearch(query: string): Array<Media & { score: number }> {
    const fuse = new Fuse(this.medias, {
      keys: ['filename'],
      includeScore: true,
      useExtendedSearch: true,
      shouldSort: true,
    })
    const results = fuse.search(`${ query } | "${ query }"`)

    return results.map(result => ({
      ...result.item,
      score: result.score,
    }))
  }

  async refresh(): Promise<MediaManager> {
    return fs.promises.readdir(this.mediaFolderPath)
      .then(files => {
        this.medias = files.map(filename => new Media(path.resolve(this.mediaFolderPath, filename)))
        return this
      })
  }

  static async init(mediaFolderPath): Promise<MediaManager> {
    return new MediaManager(mediaFolderPath)
      .refresh()
  }
}
