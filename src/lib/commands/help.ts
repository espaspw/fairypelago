import { Command, CommandLookup } from '../../types/command'

function findAlias(commands: CommandLookup, alias: string) {
  for (const command of Object.values(commands)) {
    for (const a of command.aliases) {
      if (alias === a) return command
    }
  }
  return null
}

const help: Command = {
  name: 'Help',
  aliases: ['help', 'h'],
  categories: ['Utility'],
  description: 'Get information about commands.',
  helpMessage: 'help <`command`>',
  async execute(message, tokens, commands = {}) {
    if (tokens[0] !== undefined) {
      const possibleCommand = tokens[0]
      const matchingCommand = findAlias(commands, possibleCommand)
      if (matchingCommand === null) {
        await message.reply('Command not found.')
      } else {
        const helpMessageTokens = []
        helpMessageTokens.push(`**${matchingCommand.name}**`)
        helpMessageTokens.push(`-# ${matchingCommand.aliases.map(a => `"${a}"`).join(', ')}`)
        helpMessageTokens.push(matchingCommand.description)
        if (matchingCommand.helpMessage) {
          helpMessageTokens.push(' ')
          helpMessageTokens.push(matchingCommand.helpMessage)
        }
        await message.reply(helpMessageTokens.join('\n'))
      }
    } else {
      const seen = new Set<string>()
      const commandList = []
      for (const command of Object.values(commands)) {
        if (seen.has(command.name)) continue;
        seen.add(command.name)
        commandList.push(`> ${command.name}: ${command.aliases.join(', ')}\n-# ${command.description ?? 'No description'}`)
      }
      await message.reply(commandList.join('\n'))
    }
  },
}

export default help
