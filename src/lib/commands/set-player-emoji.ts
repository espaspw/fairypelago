import { Command } from '../../types/command'
import * as DB from '../../db/db'

import { PermissionFlagsBits } from 'discord.js'

const setPlayerEmoji: Command = {
  name: 'Set Player Emoji',
  aliases: ['pe', 'playeremoji', 'setplayeremoji'],
  categories: ['Settings', 'Admin'],
  description: 'Settings for changing player alias to emoji settings for this guild. The emoji must be from this guild or else it might not render. The toggle-replace-name subcommand will toggle whether names will be completely replaced by emojis or not.',
  usageHelpText: '- pe\n- pe get `player-alias`\n- pe set `player-alias` `emoji`\n- pe delete `player-alias`\n- pe delete-all\n- pe toggle-replace-name',
  async execute(message, tokens) {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)
        && message.author.id !== process.env.OWNER_ID) {
      await message.reply('Only admins can use this command.')
      return;
    }
    if (tokens[0] === undefined) {
      const responseTokens = ['Current mappings:']
      const mappings = DB.getAllEmojisForPlayerAlias(message.guildId)
      if (!mappings || Object.keys(mappings).length <= 0) {
        await message.reply('No emojis are currently set.')
        return;
      }
      for (const [alias, emoji] of Object.entries(mappings)) {
        responseTokens.push(`- ${alias}: ${emoji}`)
      }
      await message.reply(responseTokens.join('\n'))
    } else {
      if (tokens[0] === 'get') {
        if (tokens.length === 1) {
          await message.reply('Requires a player name.')
          return;
        }
        const alias = tokens.splice(1).join(' ')
        const emoji = DB.getEmojiForPlayerAlias(message.guildId, alias)
        if (emoji === null) {
          await message.reply(`Emoji not set for "${alias}".`)
        } else {
          await message.reply(emoji)
        }
      } else if (tokens[0] === 'set') {
        if (tokens.length === 2) {
          await message.reply('Requires both a player name and an emoji.')
          return;
        }
        const alias = tokens.splice(1, tokens.length - 2).join(' ')
        const emoji = tokens[tokens.length - 1]
        await DB.setEmojiForPlayerAlias(message.guildId, alias, emoji)
        await message.reply(`Emoji for "${alias}" set to "${emoji}".`)
      } else if (tokens[0] === 'delete') {
        if (tokens.length === 1) {
          await message.reply('Requires a player name.')
          return;
        }
        const alias = tokens.splice(1).join(' ')
        const existingEmoji = DB.getEmojiForPlayerAlias(message.guildId, alias)
        if (existingEmoji === null) {
          await message.reply(`Alias "${alias}" not found. Perhaps it was already deleted?`)
        } else {
          await DB.removeEmojiForPlayerAlias(message.guildId, alias)
          await message.reply(`Emoji for "${alias}" was removed.`)
        }
      } else if (tokens[0] === 'toggle-replace-name') {
        const newValue = await DB.toggleFlag(message.guildId, 'replace-alias-with-emoji-if-exists')
        if (newValue) {
          await message.reply('Names will now be replaced with emojis when avaliable.')
        } else {
          await message.reply('Names will no longer be replaced with emojis when avaliable.')
        }
      } else if (tokens[0] === 'delete-all') {
        await DB.removeAllEmojisForPlayerAlias(message.guildId)
        await message.reply('All entries have been removed.')
      } else {
        await message.reply(`Possible subcommands are "get", "set", "delete", "delete-all", and "toggle-replace-name".`)
      }
    }
  },
}

export default setPlayerEmoji
