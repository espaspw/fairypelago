import { Client } from 'discord.js'
import { ArchipelagoClientManager } from '../lib/archipelago-client-manager'

export interface JobOptionalDeps {
  archClients: ArchipelagoClientManager
  discordClient: Client
}

export interface Job {
  name: string
  intervalMs: number
  do: (deps: JobOptionalDeps) => Promise<void>
}

export type Jobs = Record<string, Job>
