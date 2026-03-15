import { search } from 'fast-fuzzy'

import { SessionCommand } from '../../types/session-command.js'
import { sendNewlineSplitDiscordTextMessage } from '../util/message-utils.js'

export const find: SessionCommand = {
  name: 'find',
  description: 'Find an item or location from the datapackage.',
  async execute (message, args, session) {
    if (args.length <= 1 || (args[0] !== 'location' && args[0] !== 'item')) {
      await message.reply('Possible things to find: `find location <name>` and `find item <name>`')
      return
    }
    if (args[0] === 'item') {
      const queryTerm = args.slice(1).join(' ')
      const gameNames = session.staticState.players.map(p => p.game.name)
      const dataPackage = await session.getDataPackage(gameNames)
      const allTopResults: Record<string, string[]> = {}

      for (const gameName of gameNames) {
        if (!(gameName in dataPackage.games)) continue
        if (gameName in allTopResults) continue
        const items = Object.keys(dataPackage.games[gameName].item_name_to_id)
        const result = search(queryTerm, items)
        const topResults = result.slice(0, 12)
        allTopResults[gameName] = topResults
      }
      const responseTokens = []
      for (const [gameName, topResults] of Object.entries(allTopResults)) {
        if (topResults.length <= 0) continue
        responseTokens.push(`> **${gameName}**`)
        responseTokens.push(topResults.join(', '))
      }
      if (responseTokens.length <= 0) {
        await message.reply('I couldn\'t find any matching items...')
      } else {
        await sendNewlineSplitDiscordTextMessage(message.reply.bind(message), responseTokens.join('\n'))
      }
    } else if (args[0] === 'location') {
      const queryTerm = args.slice(1).join(' ')
      const dataPackage = await session.getDataPackage()
      const allTopResults: Record<string, string[]> = {}

      for (const gameName of session.staticState.players.map(p => p.game.name)) {
        if (gameName in allTopResults) continue
        if (!(gameName in dataPackage.games)) continue
        const locations = Object.keys(dataPackage.games[gameName].location_name_to_id)
        const result = search(queryTerm, locations)
        const topResults = result.slice(0, 12)
        allTopResults[gameName] = topResults
      }
      const responseTokens = []
      for (const [gameName, topResults] of Object.entries(allTopResults)) {
        if (topResults.length <= 0) continue
        responseTokens.push(`> **${gameName}**`)
        responseTokens.push(topResults.join(', '))
      }
      if (responseTokens.length <= 0) {
        await message.reply('I couldn\'t find any matching locations...')
      } else {
        await sendNewlineSplitDiscordTextMessage(message.reply.bind(message), responseTokens.join('\n'))
      }
    }
  },
}
