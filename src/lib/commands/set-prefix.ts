import { PermissionFlagsBits } from 'discord.js'

import { Command } from '../../types/command.js'
import { replyWithError } from '../util/message-utils.js';

const setPrefix: Command = {
  name: 'Set Prefix',
  aliases: ['prefix', 'setprefix'],
  categories: ['Settings', 'Admin'],
  description: 'Sets the command prefix for the current guild.',
  usageHelpText: 'prefix `new-prefix`',
  async execute(message, tokens, _commands, { guildSettingsRepo }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)
      && message.author.id !== process.env.OWNER_ID) {
      await message.reply('Only admins can use this command.')
      return;
    }
    if (!message.guildId) {
      await replyWithError(message, `Settings can only be set in a guild.`)
      return;
    }
    if (tokens[0] === undefined) {
      const currentSettings = await guildSettingsRepo.getSettings(message.guildId)
      await message.reply(`Main prefix: (${currentSettings.commandPrefix})\nRoom prefix: (${currentSettings.sessionCommandPrefix})`)
    } else {
      await guildSettingsRepo.setPrefix(message.guildId, tokens[0])
      await message.reply(`Prefix has been set to (${tokens[0]}).`)
    }
  },
}

export default setPrefix
