import { SessionCommand } from '../../types/session-command.js'

const helpMessage = `You need help? Fine. Here's what I'll respond to:
- \`restart\` : I'll attempt to reconnect to the AP server for you.
- \`status\` : I'll look up the current status of the AP world.
- \`change channel <id>\` : Tired of this channel? I'll move which channel I log to.
- \`change vessel <player name>\` : I'll change which vessel I inhabit.
- \`find location <name>\` : I can look up locations in your world.
- \`find item <name>\` : I can look up items in your world.
- \`hint <player name>\` : I'll look up which hints this player asked for.
- \`tell me when <player> gets <item name>\` : BK? I'll ping you when this player receives an item.
`

export const help: SessionCommand = {
  name: 'help',
  description: 'Get information about session commands',
  async execute(message, _args, session) {
    await message.reply(helpMessage)
  },
}
