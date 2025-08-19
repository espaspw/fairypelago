import { Command } from '../../types/command'
import { extractFlags } from '../util/command-utils'

const debug: Command = {
  name: 'debug',
  aliases: ['debug'],
  categories: ['Utility', 'Owner'],
  description: 'Debug master command for the bot owner.',
  usageHelpText: '',
  flags: {
    guildId: {
      name: 'guild',
      type: String,
      default: undefined,
      alias: 'g',
      argName: 'id',
      description: 'Target guild to do debug on.',
      isHiddenDefault: true,
    },
  },
  async execute(message, tokens, _, archClients) {
    if (message.author.id !== process.env.OWNER_ID) {
      await replyWithError(message, 'Only the bot owner can use this command.')
      return;
    }
    const { flags, splicedTokens } = extractFlags(this.flags, tokens)
    if (splicedTokens.length <= 0) return;
    const subcommand = splicedTokens[0]
    if (subcommand === 'client-status') {
      const guildId = (flags.guildId as string) ?? message.guildId
      if (splicedTokens.length === 1) {
        const clients = archClients._getClients(guildId)
        if (clients === null || clients.length === 0) {
          await message.reply('No clients found.')
          return;
        }
        const statuses = clients.map(c => `- Channel: ${c.channel.id} | State: ${c.state} | Err: ${c.lastError?.message ?? 'N/A'}`)
        await message.reply(statuses.join('\n'))
      }
    }
  },
}

export default debug
