import { Command } from '../../types/command.js'
import { extractFlags } from '../util/command-utils.js'
import { replyWithError } from '../util/message-utils.js';

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
    if (subcommand === 'client-status') { }

  },
}

export default debug
