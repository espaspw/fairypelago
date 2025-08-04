import { Command, FlagDefinition, FlagType } from '../../types/command'
import { EmbedBuilder } from 'discord.js'
import { findAlias } from '../util/command-utils'

function formatFlagDefinitions(flags: FlagDefinition[]) {
  return flags.map(flag => {
    if (flag.type === FlagType.Argless) {
      return `\`--${flag.name}\`${flag.description ? `: ${flag.description}` : ''}`
    } else {
      return `\`--${flag.name}=<${flag.argName ?? '...'}>\`${flag.description ? `: ${flag.description}` : ''}`
    }
  }).join('\n')
}

const help: Command = {
  name: 'Help',
  aliases: ['help', 'h'],
  categories: ['Utility'],
  description: 'Get information about commands.',
  usageHelpText: 'help <`command`>',
  async execute(message, tokens, commands = {}) {
    if (tokens[0] === undefined) {
      const seen = new Set<string>()
      const commandList = []
      for (const command of Object.values(commands)) {
        if (seen.has(command.name)) continue;
        seen.add(command.name)
        commandList.push(`> ${command.name}: ${command.aliases.join(', ')}\n-# ${command.description ?? 'No description'}`)
      }
      await message.reply(commandList.join('\n'))
    } else {
      const possibleCommand = tokens[0]
      const matchingCommand = findAlias(commands, possibleCommand)
      if (matchingCommand === null) {
        await message.reply('Command not found.')
      } else {
        const embed = new EmbedBuilder()
          .setTitle(matchingCommand.name)
          .addFields([{
            name: 'Aliases',
            value: matchingCommand.aliases.map(a => `"${a}"`).join(', '),
          }])
        if (matchingCommand.description) {
          embed.setDescription(matchingCommand.description)
        }
        if (matchingCommand.categories.length > 0) {
          embed.addFields([{
            name: 'Categories',
            value: matchingCommand.categories.join(', '),
          }])
        }
        if (matchingCommand.helpMessage) {
          embed.addFields([{
            name: 'Usage',
            value: matchingCommand.usageHelpText,
          }])
        }
        if (matchingCommand.flags && matchingCommand.flags.length > 0) {
          embed.addFields([{
            name: 'Flags',
            value: formatFlagDefinitions(matchingCommand.flags)
          }])
        }
        await message.reply({ embeds: [embed] })
      }
    }
  },
}

export default help
