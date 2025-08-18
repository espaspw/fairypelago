/** Multiworld data taken from the room page */
export interface ArchipelagoRoomData {
  players: ArchipelagoRoomPlayerData[]
  port: string
  roomUrl: string
}

/** Player data taken from the room page */
export interface ArchipelagoRoomPlayerData {
  id: string
  name: string
  game: string
  downloadLink: string | null
  trackerPage: string
}

/** Type wrapper for a parsed archipelago.gg/room url */
export interface ArchipelagoRoomUrl {
  url: string
}

/** Enum representing possible message types from the archipelago websocket */
export enum ArchipelagoMessageType {
  Connected,
  Disconnected,
  ItemSentProgression,
  ItemSentUseful,
  ItemSentFiller,
  ItemSentTrap,
  ItemHinted,
  ItemCheated,
  UserChat,
  ServerChat,
  UserCommand,
  ServerCommand,
  Goal
}

export type ItemCounts = {
  [key: string]: number
}

export type LocationCounts = {
  [key: string]: number
}
