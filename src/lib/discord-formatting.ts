import * as DC from 'discord.js'
import type { ArchipelagoRoomData, ArchipelagoRoomPlayerData, ItemCounts, LocationCounts } from '../types/archipelago-types';

function createUserDataDisplay(
  playerData: ArchipelagoRoomPlayerData,
  itemCount: ItemCounts,
  locationCount: LocationCounts,
): string {
  const tokens = [
    `- **${playerData.name}** : ${playerData.game} (${itemCount?.[playerData.game] ?? 0} items, ${locationCount?.[playerData.game] ?? 0} checks)`,
    `-# ([Tracker](<${playerData.trackerPage}>)${playerData.downloadLink ? ` | [Patch](<${playerData.downloadLink}>)` : ''})`
  ]
  return tokens.join('\n')
}

export function createRoomDataDisplay(
  roomData: ArchipelagoRoomData,
  itemCount: ItemCounts,
  locationCount: LocationCounts,
): string | DC.MessagePayload | DC.MessageCreateOptions {
  const tokens = ['### Player Worlds']
  tokens.push(...roomData.players.map(player => createUserDataDisplay(player, itemCount, locationCount)))
  const description = tokens.join('\n')
  return {
    embeds: [{ description }],
  }
}
