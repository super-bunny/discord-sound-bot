import * as fs from 'fs'
import * as path from 'path'
import Fuse from 'fuse.js'

export default class MediaManager {
  readonly mediaFolderPath: string
  data: string[]

  constructor(mediaFolderPath: string) {
    this.mediaFolderPath = mediaFolderPath
  }

  getRandomMedia(): { name: string, filepath: string } {
    const randomIndex = Math.trunc(Math.random() * this.data.length)

    return {
      name: this.getFilenameList()[randomIndex],
      filepath: this.data[randomIndex],
    }
  }

  getBySearch(query: string): Array<{ score: number, name: string, filepath: string }> {
    const fuse = new Fuse(this.getFilenameList(), { includeScore: true })
    const results = fuse.search(query)

    return results.map(result => ({
      score: result.score,
      name: result.item,
      filepath: this.data[result.refIndex],
    }))
  }

  getByFileName(fileNameQuery: string): string {
    return this.data.find(filePath => {
      const filename = path.basename(filePath, '.' + filePath.split('.').pop())
      return filename == fileNameQuery
    })
  }

  getFilenameList(): string[] {
    return this.data.map(filePath => path.basename(filePath, '.' + filePath.split('.').pop()))
  }

  async refresh(): Promise<MediaManager> {
    return fs.promises.readdir(this.mediaFolderPath)
      .then(files => files.map(file => path.resolve(this.mediaFolderPath, file)))
      .then(files => {
        this.data = files
        return this
      })
  }

  static async init(mediaFolderPath): Promise<MediaManager> {
    return new MediaManager(mediaFolderPath)
      .refresh()
  }
}
