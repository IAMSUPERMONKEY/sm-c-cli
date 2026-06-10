import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { CLI_NAME } from '../config.js'

let cached: string | undefined

export function getClientId(): string {
  if (cached) return cached
  const dir = join(homedir(), '.config', CLI_NAME)
  const file = join(dir, 'client-id')
  if (existsSync(file)) {
    cached = readFileSync(file, 'utf8').trim()
  } else {
    cached = randomUUID()
    mkdirSync(dir, { recursive: true })
    writeFileSync(file, cached, 'utf8')
  }
  return cached
}
