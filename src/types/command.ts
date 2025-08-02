import { Message } from 'discord.js'

export type CommandLookup = {
  [key: string]: Command
}

export interface Command {
  execute: (discordMessage: Message, tokens?: string[], commands?: CommandLookup) => Promise<void>
  name: string
  aliases: string[]
  categories: string[]
  description?: string
  helpMessage?: string
}
