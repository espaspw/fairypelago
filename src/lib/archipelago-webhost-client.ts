import { NetworkItem, NetworkHint } from 'archipelago.js'
import axios from 'axios'

import { logger } from './util/logger.js'

type RawWebhostRoomPlayer = [string, string]
type RawWebhostHintStatus = 0 | 10 | 20 | 30 | 40
type RawWebhostHint = [number, number, number, number, boolean, string, number, RawWebhostHintStatus]
type RawWebhostItem = [number, number, number, number]
type RawWebhostClientStatus = 0 | 5 | 10 | 20 | 30

interface RawWebhostRoomStatus {
  downloads: {
    download: string,
    slot: number,
  }[],
  last_activity: string,
  last_port: number,
  players: RawWebhostRoomPlayer[],
  timeout: number,
  tracker: string,
}

interface RawWebhostTracker {
  activity_timers: {
    player: number,
    team: number,
    time: string | null,
  }[],
  aliases: {
    alias: string | null,
    player: number,
    team: number,
  }[],
  connection_timers: {
    player: number,
    team: number,
    time: string | null,
  }[],
  hints: {
    hints: RawWebhostHint,
    player: number,
    team: number,
  }[],
  player_checks_done: {
    locations: number[],
    player: number,
    team: number,
  }[],
  player_items_received: {
    items: RawWebhostItem[],
    player: number,
    team: number,
  }[],
  player_status: {
    player: number,
    status: RawWebhostClientStatus,
    team: number,
  }[],
  total_checks_done: {
    checks_done: number,
    team: number,
  }[],
}

interface RawWebhostStaticTracker {
  datapackage: Record<string, { checksum: string, version: number }>,
  groups: {
    slot: number,
    name: string,
    members: number[],
  },
  player_game: {
    game: string,
    player: number,
    team: number,
  }[],
  player_locations_total: {
    player: number,
    team: number,
    total_locations: number,
  }[],
}

export interface WebhostPlayer {
  slotId: number,
  slotName: string,
  game: string,
  team: number,
  alias: string | null,
  download: string | null,
}

export interface WebhostGame {
  slotId: number,
  name: string,
  totalLocations: number,
  dataPackage: {
    checksum: string,
    version: number,
  },
}

export interface WebhostInitialSessionData {
  trackerId: string,
  port: number,
  players: WebhostPlayer[],
  games: WebhostGame[],
}

export type WebhostPlayerStatus =
  'Unknown' | 'Connected' | 'Ready' | 'Playing' | 'Goaled'

export interface WebhostSessionStatus {
  port: number,
  lastRoomActivity: Date,
  lastPlayerActivity: Record<number, Date | null>,
  lastPlayerConnection: Record<number, Date | null>,
  checksDone: Record<number, number[]>,
  itemsReceived: Record<number, NetworkItem[]>,
  aliases: Record<number, string | null>,
  playerStatus: Record<number, WebhostPlayerStatus>,
}

export class ArchipelagoWebhostClient {
  #baseDomain: string

  constructor(baseDomain = 'archipelago.gg') {
    this.#baseDomain = baseDomain
  }

  async #getRawRoomStatus(roomId: string) {
    const url = `https://${this.#baseDomain}/api/room_status/${roomId}`
    try {
      const rawRoomStatus = await axios.get<RawWebhostRoomStatus>(url)
      if (rawRoomStatus.status !== 200) {
        logger.warn(`Received non-200 http code when fetching room status from webhost`, {
          status: rawRoomStatus.status,
          statusText: rawRoomStatus.statusText,
          roomId,
        })
        return null;
      }
      return rawRoomStatus.data
    } catch (err) {
      logger.warn(`Failed to fetch room status from webhost`, {
        roomId,
        error: err,
      })
      return null;
    }
  }

  async #getRawTracker(trackerId: string) {
    const url = `https://${this.#baseDomain}/api/tracker/${trackerId}`
    try {
      const rawTracker = await axios.get<RawWebhostTracker>(url)
      if (rawTracker.status !== 200) {
        logger.warn(`Received non-200 http code when fetching tracker data from webhost`, {
          status: rawTracker.status,
          statusText: rawTracker.statusText,
          trackerId,
        })
        return null;
      }
      return rawTracker.data
    } catch (err) {
      logger.warn(`Failed to fetch tracker data from webhost`, {
        trackerId,
        error: err,
      })
      return null;
    }
  }

  async #getRawStaticTracker(trackerId: string) {
    const url = `https://${this.#baseDomain}/api/static_tracker/${trackerId}`
    try {
      const rawStaticTracker = await axios.get<RawWebhostStaticTracker>(url)
      if (rawStaticTracker.status !== 200) {
        logger.warn(`Received non-200 http code when fetching static tracker data from webhost`, {
          status: rawStaticTracker.status,
          statusText: rawStaticTracker.statusText,
          trackerId,
        })
        return null;
      }
      return rawStaticTracker.data
    } catch (err) {
      logger.warn(`Failed to fetch static tracker data from webhost`, {
        trackerId,
        error: err,
      })
      return null;
    }
  }

  async fetchInitialSessionData(roomId: string): Promise<WebhostInitialSessionData | null> {
    const roomStatus = await this.#getRawRoomStatus(roomId)
    if (!roomStatus) return null;
    const trackerId = roomStatus.tracker
    const tracker = await this.#getRawTracker(trackerId)
    if (!tracker) return null;
    const staticTracker = await this.#getRawStaticTracker(trackerId)
    if (!staticTracker) return null;

    const downloadLookup = roomStatus.downloads.reduce((acc, curr) => {
      return acc.set(curr.slot, curr.download)
    }, new Map<number, string>())
    const aliasLookup = tracker.aliases.reduce((acc, curr) => {
      if (!curr.alias) return acc;
      return acc.set(curr.player, curr.alias)
    }, new Map<number, string>())
    const totalLocationsLookup = staticTracker.player_locations_total.reduce((acc, curr) => {
      return acc.set(curr.player, curr.total_locations)
    }, new Map<number, number>())


    const playerList: WebhostPlayer[] = staticTracker.player_game.map(playerGame => ({
      slotId: playerGame.player,
      slotName: roomStatus.players[playerGame.player - 1][0],
      game: playerGame.game,
      team: playerGame.team,
      alias: aliasLookup.get(playerGame.player) ?? null,
      download: downloadLookup.get(playerGame.player) ?? null,
    }))
    const gameList: WebhostGame[] = staticTracker.player_game.map(playerGame => ({
      slotId: playerGame.player,
      name: playerGame.game,
      totalLocations: totalLocationsLookup.get(playerGame.player) ?? 0,
      dataPackage: staticTracker.datapackage[playerGame.game],
    }))
    return {
      trackerId,
      port: roomStatus.last_port,
      players: playerList,
      games: gameList,
    }
  }

  async fetchSessionStatus(roomId: string): Promise<WebhostSessionStatus | null> {
    const roomStatus = await this.#getRawRoomStatus(roomId)
    if (!roomStatus) return null;
    const tracker = await this.#getRawTracker(roomStatus.tracker)
    if (!tracker) return null;

    return {
      port: roomStatus.last_port,
      lastRoomActivity: new Date(roomStatus.last_activity),
      lastPlayerActivity:
        tracker.activity_timers.reduce<Record<number, Date | null>>((acc, curr) => {
          acc[curr.player] = curr.time ? new Date(curr.time) : null
          return acc
        }, {}),
      lastPlayerConnection:
        tracker.connection_timers.reduce<Record<number, Date | null>>((acc, curr) => {
          acc[curr.player] = curr.time ? new Date(curr.time) : null
          return acc
        }, {}),
      checksDone:
        tracker.player_checks_done.reduce<Record<number, number[]>>((acc, curr) => {
          acc[curr.player] = curr.locations
          return acc
        }, {}),
      itemsReceived:
        tracker.player_items_received.reduce<Record<number, NetworkItem[]>>((acc, curr) => {
          acc[curr.player] = curr.items.map(rawItem => ({
            item: rawItem[0],
            location: rawItem[1],
            player: rawItem[2],
            flags: rawItem[3],
          }))
          return acc
        }, {}),
      aliases:
        tracker.aliases.reduce<Record<number, string | null>>((acc, curr) => {
          acc[curr.player] = curr.alias
          return acc
        }, {}),
      playerStatus:
        tracker.player_status.reduce<Record<number, WebhostPlayerStatus>>((acc, curr) => {
          acc[curr.player] = (() => {
            if (curr.status === 5) {
              return 'Connected'
            } else if (curr.status === 10) {
              return 'Ready'
            } else if (curr.status === 20) {
              return 'Playing'
            } else if (curr.status === 30) {
              return 'Goaled'
            } else {
              return 'Unknown'
            }
          })()
          return acc
        }, {}),
    }
  }
}