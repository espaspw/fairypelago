import { Message } from 'discord.js'

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

export interface Command {
  execute: (discordMessage: Message, tokens?: string[], commands?: CommandLookup) => Promise<void>
  name: string
  aliases: string[]
  categories: string[]
  flags?: FlagSchema
  description?: string
  usageHelpText?: string
}
