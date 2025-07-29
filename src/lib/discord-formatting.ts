import * as DC from 'discord.js'
import type { ArchipelagoRoomData, ArchipelagoRoomPlayerData } from '../types/archipelago-types';

function createUserDataDisplay(playerData: ArchipelagoRoomPlayerData): string {
  const tokens = [
    `- **${playerData.name}** : ${playerData.game}`,
    `-# ([Tracker](<${playerData.trackerPage}>)${playerData.downloadLink ? ` | [Patch](<${playerData.downloadLink}>)` : ''})`
  ]
  return tokens.join('\n')
}

export function createRoomDataDisplay(roomData: ArchipelagoRoomData): string | DC.MessagePayload | DC.MessageCreateOptions {
  const tokens = ['### Player Worlds']
  tokens.push(...roomData.players.map(createUserDataDisplay))
  const description = tokens.join('\n')
  const embed = new DC.EmbedBuilder()
    .setTitle('Player Worlds')
    .setURL(roomData.roomUrl)
    .setDescription(description)
    .setTimestamp()
  return {
    embeds: [{ description }],
  }
}
