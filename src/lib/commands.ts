import fs from 'node:fs/promises'
import path from 'node:path'
import { Command, CommandLookup } from '../types/command.js'
import { logger } from './util/logger.js'

let avaliableCommands: CommandLookup = {}

async function loadAvaliableCommands(): Promise<CommandLookup> {
  avaliableCommands = {}
  const files = await fs.readdir(path.join(import.meta.dirname, 'commands'))
  for (const file of files) {
    try {
      const command = (await import(`./commands/${file.replace('.ts', '')}`)).default as Command
      command.aliases.forEach(alias => {
        avaliableCommands[alias] = command
      })
    } catch (err) {
      console.error(err)
    }
  }
  return avaliableCommands
}

export async function reloadAvaliableCommands() {
  avaliableCommands = await loadAvaliableCommands()
  logger.info('Reloaded global commands', {
    commands: Object.keys(avaliableCommands),
  })
}

export function getAvaliableCommands(): CommandLookup {
  return avaliableCommands
}
