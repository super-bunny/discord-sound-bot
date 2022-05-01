// import { version } from '../../package.json'
import pkg from '../../package.json'

const { version } = pkg

function maskString(str: string, percentToHide: number = 0.8): string {
  const hide = str.length * percentToHide

  return '*'.repeat(hide) + str.slice(hide)
}

export default function printAppEnv() {
  console.info([
    '=========================================================',
    `App version: ${ version }`,
    `Media folder: ${ process.env.MEDIA_FOLDER }`,
    `API port: ${ process.env.API_PORT }`,
    `Discord app ID: ${ maskString(process.env.DISCORD_APP_ID ?? '') }`,
    `Discord public key: ${ maskString(process.env.DISCORD_PUBLIC_KEY ?? '') }`,
    `Discord token: ${ maskString(process.env.DISCORD_TOKEN ?? '') }`,
    '=========================================================',
  ].join('\n'))
}
