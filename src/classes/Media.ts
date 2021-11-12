import path from 'path'

export default class Media {
  public readonly filename: string

  public readonly name: string

  constructor(public readonly filepath: string) {
    this.filename = path.parse(filepath).name
    this.name = this.filename.replace(/_/g, ' ')
  }
}
