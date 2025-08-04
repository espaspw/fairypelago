import { Command } from '../../types/command'
import * as DB from '../../db/db'

import { PermissionFlagsBits } from 'discord.js'
import { replyWithError } from '../util/message-utils'

const setItemMessage: Command = {
  name: 'Set Item Message',
  aliases: ['itemmessage', 'setitemmessage'],
  categories: ['Utility', 'Admin'],
  description: 'Sets the command prefix for the current guild.',
  usageHelpText: 'prefix `new-prefix`',
  async execute(message, tokens) {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)
        && message.author.id !== process.env.OWNER_ID) {
      await replyWithError(message, 'Only admins can use this command.')
      return;
    }
    if (tokens[0] === undefined) {
      await message.reply(`Current prefix is (${DB.getCommandPrefix(message.guildId)}).`)
    } else {
      await DB.setCommandPrefix(message.guildId, tokens[0])
      await message.reply(`Prefix has been set to (${tokens[0]}).`)
    }
  },
}

export default setItemMessage
