import * as DC from 'discord.js'

import { SessionStaticState } from '../archipelago-session.js'

export function createRoomDataDisplay(staticState: SessionStaticState,): string | DC.MessagePayload | DC.MessageCreateOptions {
  const tokens = ['### Player Worlds']
  const numberOfTeams = staticState.players.reduce((acc, curr) => acc.add(curr.team), new Set<number>()).size
  staticState.players.forEach(player => {
    if (numberOfTeams === 1) {
      tokens.push(`- **${player.slotName}** : ${player.game.name} (${player.game.totalLocations} checks)`)
    } else {
      tokens.push(`- **${player.slotName}** [Team ${player.team}] : ${player.game.name} (${player.game.totalLocations} checks)`)
    }
  })
  return { embeds: [{ description: tokens.join('\n') }] }
}

export type TimestampType =
  'relative' | 'short time' | 'long time' | 'short date' | 'long date' | 'long date with short time' | 'long date with dow'

const timestampMapping: Record<TimestampType, string> = {
  relative: 'R',
  'long date with dow': 'F',
  'long date with short time': 'f',
  'long date': 'D',
  'short date': 'd',
  'long time': 'T',
  'short time': 't',
}

export function convertToTimestamp(date: Date, type: TimestampType = 'long date with dow') {
  const tail = timestampMapping[type]
  return `<t:${Math.floor(date.getTime() / 1000)}:${tail}>`
}
