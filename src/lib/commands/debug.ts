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
        const statuses = clients.map(c => {
          const cols = []
          if (c.channel.guildId !== message.guildId)
            cols.push(`\`${message.guild.name}\``);
          cols.push(c.channel.url)
          cols.push(`Cr <t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}>`)
          if (c.lastConnected)
            cols.push(`Cn <t:${Math.floor(new Date(c.lastConnected / 1000).getTime())}>`);
          if (c.lastDisconnected)
            cols.push(`Dc <t:${Math.floor(new Date(c.lastDisconnected / 1000).getTime())}>`);
          cols.push(`State: \`${c.state}\``)
          if (c.lastError)
            cols.push(`Err: \`${c.lastError.message}\``)
          return `- ${cols.join(' ')}`
        })
        await message.reply(statuses.join('\n'))
      }
    } else if (subcommand === 'missing') {
      const guildId = (flags.guildId as string) ?? message.guildId
      const clients = archClients._getClients(guildId)
      const first = clients[0]
      if (!first) return;
      const games = first.getGameList()
      await first.fetchPackage()
      await message.reply(games.join(', ') ?? 'None')
      await message.reply(first.getMissingLocations(games[0]))
    }
  },
}

export default debug
