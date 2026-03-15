import { search } from 'fast-fuzzy'

import { SessionCommand } from '../../types/session-command.js'
import { getItemTierIcon, lookupItem } from '../icon-lookup-table.js'
import { replyWithError } from '../util/message-utils.js'
import { Item } from 'archipelago.js'

function itemFlagToIcon (flags: number): string {
  if (flags & 0b001) return getItemTierIcon('progression') ?? 'unknown'
  if (flags & 0b010) return getItemTierIcon('useful') ?? 'unknown'
  if (flags & 0b100) return getItemTierIcon('trap') ?? 'unknown'
  return getItemTierIcon('filler') ?? 'unknown'
}

function formatItem (item: Item) {
  const r = lookupItem(item.game, item.name)
  if (r === null) return item.name
  return `${r} ${item.name}`
}

export const hint: SessionCommand = {
  name: 'hint',
  description: 'Get the hints for a player',
  async execute (message, args, session) {
    if (args.length <= 0) {
      const hintingInfo = await session.getHintingInfo()
      if (!hintingInfo) {
        await replyWithError(message, 'I couldn\'t seem to get the hinting info...')
        return
      }
      const tokens = [
        `**My current vessel**: ${hintingInfo?.vesselName}`,
        `**Cost**: ${hintingInfo.hintCost} (${hintingInfo.hintCostPercentage}% of checks)`,
        `**Points**: ${hintingInfo.hintPoints}`,
      ]
      message.reply(tokens.join('\n'))
    } else {
      const maybeSlotName = args.join(' ')
      const slotName = await (async () => {
        const playerNames = session.staticState.players.map(p => p.slotName)
        if (!playerNames.includes(maybeSlotName)) {
          const fuzzyResult = search(maybeSlotName, playerNames)
          if (fuzzyResult.length <= 0) {
            return null
          }
          return fuzzyResult[0]
        }
        return maybeSlotName
      })()
      if (!slotName) {
        await message.reply(`Who in the world is ${maybeSlotName}?`)
        return
      }
      const hints = await session.getPlayerHints(slotName)
      if (!hints) {
        await replyWithError(message, `I couldn't seem to get the hints for __${slotName}__...`)
        return
      }
      if (hints.length <= 0) {
        await message.reply(`There are currently no unfound hints for __${slotName}__.`)
      } else {
        const hintsText = hints.map(hint => (
          `- ${itemFlagToIcon(hint.item.flags)} **${formatItem(hint.item)}** at **${hint.item.locationName}** in __${hint.item.sender.alias}__'s world `
        )).join('\n')
        await message.reply([`**Hints for **__${slotName}__`, hintsText].join('\n'))
      }
    }
  },
}
