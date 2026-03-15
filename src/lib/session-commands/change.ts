import { search } from 'fast-fuzzy'

import { SessionCommand } from '../../types/session-command.js'

export const change: SessionCommand = {
  name: 'change',
  description: 'Change some aspect of the session',
  async execute (message, args, session) {
    if (args.length <= 1 || (args[0] !== 'channel' && args[0] !== 'vessel')) {
      await message.reply('Possible things to change: `change channel <id>` and `change vessel <player name>`')
      return
    }
    if (args[0] === 'vessel') {
      const maybeSlotName = args[1]
      const currentVessel = session.getCurrentVessel()
      if (maybeSlotName === currentVessel) {
        await message.reply('That\'s already my current vessel.')
        return
      }
      const existingPlayers = session.staticState.players.map(p => p.slotName)
      if (!existingPlayers.includes(maybeSlotName)) {
        const closestNames = search(maybeSlotName, existingPlayers)
        if (closestNames.length <= 0) {
          await message.reply(`I don't know anyone named __${maybeSlotName}__... `)
        } else {
          await message.reply(`I don't know anyone named __${maybeSlotName}__, did you perhaps mean __${closestNames[0]}__?`)
        }
        return
      }
      const wasSuccessful = await session.changeVessel(maybeSlotName)
      if (wasSuccessful) {
        await message.reply(`Vessel successfully changed to __${maybeSlotName}__`)
      } else {
        await message.reply(`Failed to change vessel to __${maybeSlotName}__`)
      }
    }
  },
}
