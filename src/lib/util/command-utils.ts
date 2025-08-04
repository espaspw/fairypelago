import { Flag, FlagType } from "../../types/command"

export function findAlias(commands: CommandLookup, alias: string) {
  for (const command of Object.values(commands)) {
    for (const a of command.aliases) {
      if (alias === a) return command
    }
  }
  return null
}

export function extractFlags(tokens: string[]) {
  const flags: Flag[] = []
  const splicedTokens: string[] = []
  for (const token of tokens) {
    if (token.startsWith('--')) {
      const strippedToken = token.substring(2)
      const [flagName, flagArg] = strippedToken.split('=')
      if (flagArg === undefined) {
        flags.push({ type: FlagType.Argless, name: flagName })
      } else {
        flags.push({ type: FlagType.Argful, name: flagName, arg: flagArg })
      }
    } else {
      splicedTokens.push(token)
    }
  }
  return { flags, splicedTokens }
}
