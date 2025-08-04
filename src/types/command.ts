import { Message } from 'discord.js'

export type CommandLookup = {
  [key: string]: Command
}

export enum FlagType {
  Argless,
  Argful,
}

export type FlagDefinition = {
  type: FlagType.Argful
  name: string
  description?: string
  argName?: string
} | {
  type: FlagType.Argless
  name: string
  description?: string
}

export type Flag = {
  type: FlagType.Argful,
  name: string
  arg: string
} | {
  type: FlagType.Argless,
  name: string
}

export interface Command {
  execute: (discordMessage: Message, tokens?: string[], commands?: CommandLookup) => Promise<void>
  name: string
  aliases: string[]
  categories: string[]
  flags?: FlagDefinition[]
  description?: string
  usageHelpText?: string
}