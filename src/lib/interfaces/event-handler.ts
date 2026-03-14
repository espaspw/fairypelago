import { Item, Player } from 'archipelago.js'

import { ArchipelagoSession } from '../archipelago-session.js'
import { SessionLoginAttemptResult } from '../../types/session-types.js'

export interface IEventHandler {
  sessionIdle: (session: ArchipelagoSession) => Promise<void>;
  sessionFailedAutojoin: (session: ArchipelagoSession, attemptResult: SessionLoginAttemptResult) => Promise<void>;
  socketDisconnected: (session: ArchipelagoSession, isFinished: boolean) => Promise<void>;
  socketConnected: (session: ArchipelagoSession) => Promise<void>;
  botShutdown: (session: ArchipelagoSession) => Promise<void>;
  adminCommand: (session: ArchipelagoSession, text: string) => Promise<void>;
  chat: (session: ArchipelagoSession, message: string, player: Player) => Promise<void>;
  collected: (session: ArchipelagoSession, text: string, player: Player) => Promise<void>;
  connected: (session: ArchipelagoSession, text: string, player: Player, tags: string[]) => Promise<void>;
  countdown: (session: ArchipelagoSession, text: string, value: number) => Promise<void>;
  disconnected: (session: ArchipelagoSession, text: string, player: Player) => Promise<void>;
  goaled: (session: ArchipelagoSession, text: string, player: Player) => Promise<void>;
  allGoaled: (session: ArchipelagoSession,) => Promise<void>;
  itemCheated: (session: ArchipelagoSession, text: string, item: Item) => Promise<void>;
  itemHinted: (session: ArchipelagoSession, text: string, item: Item) => Promise<void>;
  itemSent: (session: ArchipelagoSession, text: string, item: Item) => Promise<void>;
  released: (session: ArchipelagoSession, text: string, player: Player) => Promise<void>;
  serverChat: (session: ArchipelagoSession, message: string) => Promise<void>;
  tagsUpdated: (session: ArchipelagoSession, text: string, player: Player, tags: string[]) => Promise<void>;
  tutorial: (session: ArchipelagoSession, text: string) => Promise<void>;
  userCommand: (session: ArchipelagoSession, text: string) => Promise<void>;
}
