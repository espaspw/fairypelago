import { Command, FlagSchema } from '../../types/command'
import { EmbedBuilder } from 'discord.js'
import { extractFlags, findAlias } from '../util/command-utils'

function formatFlagDefinitions(flags: FlagSchema) {
  return Object.values(flags).map(flag => {
    if (flag.type === Boolean) {
      const parts = [`\`--${flag.name}\``]
      if (flag.alias) parts.push(`(\`-${flag.alias}\`)`);
      if (!flag.isHiddenDefault) parts.push(`| Default: _${flag.default}_`);
      if (flag.description) parts.push(`\n-# ${flag.description}`)
      return parts.join(' ')
    }
    else {
      const parts = [`\`--${flag.name}=<${flag.argName ?? '...'}>\``]
      if (flag.alias) parts.push(`(\`-${flag.alias}\`)`);
      if (!flag.isHiddenDefault) parts.push(`| Default: _${flag.default}_`);
      if (flag.description) parts.push(`\n-# ${flag.description}`)
      return parts.join(' ')
    }
  }).join('\n')
}

const help: Command = {
  name: 'Help',
  aliases: ['help', 'h'],
  categories: ['Utility'],
  description: 'Get information about commands.',
  usageHelpText: 'help <`command`>',
  flags: {
    category: {
      name: 'category',
      type: String,
      default: '__default',
      alias: 'c',
      argName: 'name | "all"',
      description: 'Which category to filter by. Will default to "all" minus "admin" commands.',
      isHiddenDefault: true,
    }
  },
  async execute(message, tokens, commands = {}) {
    const { flags, splicedTokens } = extractFlags(this.flags, tokens)
    if (splicedTokens[0] === undefined) {
      const seen = new Set<string>()
      const commandList = []
      for (const command of Object.values(commands)) {
        if (flags.category === '__default' && command.categories.includes('Admin')) continue;
        if (flags.category !== 'all' && flags.category !== '__default'
            && !command.categories.find(c => (c.toLocaleLowerCase() === flags.category))) continue;
        if (seen.has(command.name)) continue;
        seen.add(command.name)
        commandList.push(`> ${command.name}: ${command.aliases.join(', ')}\n-# ${command.description ?? 'No description'}`)
      }
      if (commandList.length <= 0) {
        await message.reply('No commands found.')
      } else {
        await message.reply(commandList.join('\n'))
      }
    } else {
      const possibleCommand = splicedTokens[0]
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
        if (matchingCommand.flags && Object.keys(matchingCommand.flags).length > 0) {
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
