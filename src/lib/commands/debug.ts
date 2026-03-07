import { Command } from '../../types/command.js'
import { replyWithError } from '../util/message-utils.js'

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
  async execute (message, tokens, _, archClients) {
    if (message.author.id !== process.env.OWNER_ID) {
      await replyWithError(message, 'Only the bot owner can use this command.')
      return
    }
    await replyWithError(message, 'Not yet implemented...')
  },
}

export default debug
