import { PermissionFlagsBits } from 'discord.js'

import { Command } from '../../types/command.js'
import { replyWithError } from '../util/message-utils.js'

const setPlayerEmoji: Command = {
  name: 'Set Player Emoji',
  aliases: ['pe', 'playeremoji', 'setplayeremoji'],
  categories: ['Settings', 'Admin'],
  description: 'Settings for changing player alias to emoji settings for this guild. The emoji must be from this guild or else it might not render. The toggle-replace-name subcommand will toggle whether names will be completely replaced by emojis or not.',
  usageHelpText: '- pe\n- pe get `player-alias`\n- pe set `player-alias` `emoji`\n- pe delete `player-alias`\n- pe delete-all\n- pe toggle-replace-name',
  async execute(message, tokens, _commands, { guildSettingsRepo, sessionRepo }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)
      && message.author.id !== process.env.OWNER_ID) {
      await message.reply('Only admins can use this command.')
      return;
    }
    if (!message.guildId) {
      await replyWithError(message, `Settings can only be set in a guild.`)
      return;
    }
    const { playerEmojis, sessionOptions } = await guildSettingsRepo.getSettings(message.guildId)
    if (tokens[0] === undefined) {
      const responseTokens = ['Current mappings:']
      if (Object.keys(playerEmojis).length <= 0) {
        await message.reply('No emojis are currently set.')
        return;
      }
      const groupByEmoji: Record<string, string[]> = {}
      for (const [alias, emoji] of Object.entries(playerEmojis)) {
        if (emoji in groupByEmoji) {
          groupByEmoji[emoji].push(alias)
        } else {
          groupByEmoji[emoji] = [alias]
        }
      }
      for (const [emoji, aliases] of Object.entries(groupByEmoji)) {
        responseTokens.push(`- ${aliases.sort().map(x => `\`${x}\``).join(', ')}: ${emoji}`)
      }
      await message.reply(responseTokens.join('\n'))
    } else {
      if (tokens[0] === 'get') {
        if (tokens.length === 1) {
          await message.reply('Requires a player name.')
          return;
        }
        const alias = tokens.splice(1).join(' ')
        const emoji = playerEmojis[alias] ?? null
        if (emoji === null) {
          await message.reply(`Emoji not set for "${alias}".`)
        } else {
          await message.reply(emoji)
        }
      } else if (tokens[0] === 'set') {
        if (tokens.length === 2) {
          await replyWithError(message, 'Requires both a player name and an emoji.')
          return;
        }
        const alias = tokens.splice(1, tokens.length - 2).join(' ')
        if (alias.length < 2) {
          await replyWithError(message, 'Alias must be at least 2 characters.')
          return;
        }
        const emoji = tokens[tokens.length - 1]
        await guildSettingsRepo.setPlayerEmojis(message.guildId, { ...playerEmojis, [alias]: emoji })
        await message.reply(`Emoji for "${alias}" set to "${emoji}".`)
      } else if (tokens[0] === 'delete') {
        if (tokens.length === 1) {
          await replyWithError(message, 'Requires a player name.')
          return;
        }
        const alias = tokens.splice(1).join(' ')
        const existingEmoji = playerEmojis[alias] ?? null
        if (existingEmoji === null) {
          await replyWithError(message, `Alias "${alias}" not found. Perhaps it was already deleted?`)
        } else {
          const newPlayerEmojis = { ...playerEmojis }
          delete newPlayerEmojis[alias]
          await guildSettingsRepo.setPlayerEmojis(message.guildId, newPlayerEmojis)
          await message.reply(`Emoji for "${alias}" was removed.`)
        }
      } else if (tokens[0] === 'toggle-replace-name') {
        const newValue = !sessionOptions.enablePlayerIcons
        await guildSettingsRepo.setSessionOptions(message.guildId, { ...sessionOptions, enablePlayerIcons: newValue })
        if (newValue) {
          await message.reply('Names will now be replaced with emojis when avaliable.')
        } else {
          await message.reply('Names will no longer be replaced with emojis when avaliable.')
        }
      } else if (tokens[0] === 'delete-all') {
        await guildSettingsRepo.setPlayerEmojis(message.guildId, {})
        await message.reply('All entries have been removed.')
      } else {
        await message.reply(`Possible subcommands are "get", "set", "delete", "delete-all", and "toggle-replace-name".`)
      }
    }
  },
}

export default setPlayerEmoji
