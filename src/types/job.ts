import { Client } from 'discord.js'
import { ArchipelagoSessionRegistry } from '../lib/archipelago-session-registry.js'

export interface JobOptionalDeps {
  sessionRegistry: ArchipelagoSessionRegistry
  discordClient: Client
}

export interface Job {
  name: string
  intervalMs: number
  do: (deps: JobOptionalDeps) => Promise<void>
}

export type Jobs = Record<string, Job>
