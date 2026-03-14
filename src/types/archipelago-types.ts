/** Multiworld data taken from the room page */
export interface ArchipelagoScrapeRoomData {
  players: ArchipelagoScrapeRoomPlayerData[]
  port: string
  roomUrl: string
}

/** Player data taken from the room page */
export interface ArchipelagoScrapeRoomPlayerData {
  id: string
  name: string
  game: string
  downloadLink: string | null
  trackerPage: string
}

/** Type wrapper for a parsed AP webhost room url */
export interface ArchipelagoRoomData {
  url: string
  domain: string
  roomId: string
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
  Goal,
}
