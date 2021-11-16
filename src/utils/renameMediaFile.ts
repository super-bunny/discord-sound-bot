import Path from 'path'

export default function renameMediaFile(path: string) {
  const parsedPath = Path.parse(path)
  const newName = parsedPath.name
    .replace(/[- _]+/g, '_')
    .toLowerCase()

  return `${ parsedPath.dir }/${ newName }${ parsedPath.ext.toLowerCase() }`
}
