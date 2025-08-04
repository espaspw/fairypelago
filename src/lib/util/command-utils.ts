import { typeFlag } from 'type-flag'
import { CommandLookup, FlagSchema } from '../../types/command'

export function findAlias(commands: CommandLookup, alias: string) {
  for (const command of Object.values(commands)) {
    for (const a of command.aliases) {
      if (alias === a) return command
    }
  }
  return null
}

export function extractFlags(schema?: FlagSchema, tokens: string[]) {
  if (!schema) return { flags: {}, splicedTokens: tokens, unknown: {} };
  const tokenCopy = [...tokens]
  const parsed = typeFlag(schema, tokenCopy)
  return { flags: parsed.flags, splicedTokens: parsed._, unknown: parsed.unknownFlags }
}
