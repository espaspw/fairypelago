import { PermissionFlagsBits } from 'discord.js'

import { Command } from '../../types/command.js'
import { replyWithError } from '../util/message-utils.js'

const setLogChannel: Command = {
  name: 'Set Log Channel',
  aliases: ['logchannel', 'setlogchannel'],
  categories: ['Settings', 'Admin'],
  description: 'Sets the log channel for archipelago game logs. Note that existing logs will continue to exist in their original channel.',
  usageHelpText: 'logchannel `channel-id`',
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
      const { logChannelId } = await guildSettingsRepo.getSettings(message.guildId)
      if (logChannelId === null) {
        await message.reply('Log channel not currently set.')
      } else {
        const currentChannel = await message.guild?.channels.fetch(logChannelId)
        if (!currentChannel) {
          await message.reply('Log channel is currently invalid. Maybe it was deleted?')
        } else {
          await message.reply(`Current log channel is ${currentChannel.url}.`)
        }
      }
    } else {
      const targetChannel = await message.guild?.channels.fetch(tokens[0])
      if (!targetChannel) {
        await message.reply('Channel not found.')
        return;
      }
      await guildSettingsRepo.setLogChannel(message.guildId, tokens[0])
      await message.reply(`Log channel has been set to ${targetChannel.url}.`)
    }
  },
}

export default setLogChannel
