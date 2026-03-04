import { Message, OmitPartialGroupDMChannel } from 'discord.js'

import { ArchipelagoSessionRegistry } from '../lib/archipelago-session-registry.js'
import { IGuildSettingsRepository, ISessionRepository } from '../db/interfaces.js'

export type CommandLookup = {
  [key: string]: Command
}

export type FlagDefinition = {
  name: string
  type: unknown
  default: unknown
  alias?: string
  description?: string
  argName?: string
  isHiddenDefault?: boolean
}

export type FlagSchema = {
  [key: string]: FlagDefinition
}

export interface CommandExtraDeps {
  sessionRegistry: ArchipelagoSessionRegistry,
  sessionRepo: ISessionRepository,
  guildSettingsRepo: IGuildSettingsRepository,
}

export interface Command {
  execute: (
    discordMessage: OmitPartialGroupDMChannel<Message<boolean>>,
    tokens: string[],
    commands: CommandLookup | undefined,
    extraDeps: CommandExtraDeps,
  ) => Promise<void>
  name: string
  aliases: string[]
  categories: string[]
  flags?: FlagSchema
  description?: string
  usageHelpText?: string
}
