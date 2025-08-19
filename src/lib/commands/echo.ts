import { PermissionFlagsBits } from 'discord.js'

import { Command } from '../../types/command'
import { replyWithError } from '../util/message-utils'
import { extractFlags } from '../util/command-utils'

const echo: Command = {
  name: 'echo',
  aliases: ['echo', 'e'],
  categories: ['Utility', 'Owner'],
  description: 'Repeat after me.',
  usageHelpText: 'echo `message`',
  flags: {
    channelId: {
      name: 'channel-id',
      type: String,
      default: undefined,
      alias: 'c',
      argName: 'id',
      description: 'Target channel id to echo into',
      isHiddenDefault: true,
    },
    unescape: {
      name: 'unescape',
      type: Boolean,
      default: true,
      alias: 'u',
      description: 'Trim all backslashes before echoing the message',
    }
  },
  async execute(message, tokens) {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)
        && message.author.id !== process.env.OWNER_ID) {
      await replyWithError(message, 'Only admins can use this command.')
      return;
    }
    const { flags, splicedTokens } = extractFlags(this.flags, tokens)
    if (splicedTokens.length <= 0) return;
    const outputMessage = (() => {
      const escaped = splicedTokens.join(' ')
      if (flags.unescape) {
        return escaped.replace(/\\/g, '')
      } else {
        return escaped
      }
    })()
    if (flags.channelId) {
      const channel = await message.guild?.channels.fetch(flags.channelId)
      if (!channel) {
        await replyWithError(`Channel ${flags.channelId} not found.`)
      } else if (!channel.isSendable()) {
        await replyWithError(`Cannot send message to ${channel.url}.`)
      } else {
        await channel.send(outputMessage)
      }
    } else {
      await message.channel.send(outputMessage)
    }
    await message.delete()
  },
}

export default echo
