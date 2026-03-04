import { ColumnType, Generated, JSONColumnType } from 'kysely'

import { ArchipelagoRoomData } from '../types/archipelago-types.js'
import { SessionOptions } from '../types/session-types.js'

export interface GuildSettingsTable {
  guildId: string;
  logChannelId: string | null;
  commandPrefix: string;
  sessionCommandPrefix: string;
  sessionOptions: JSONColumnType<SessionOptions>;
  playerEmojis: JSONColumnType<Record<string, string>>;
}

export interface SessionsTable {
  id: Generated<number>;
  guildId: string;
  channelId: string;
  roomData: JSONColumnType<ArchipelagoRoomData>;
  createdAt: ColumnType<Date, string | undefined, never>;
  expiredAt: ColumnType<Date | null, string | null, string | null>;
}

export interface DatabaseSchema {
  guild_settings: GuildSettingsTable;
  sessions: SessionsTable;
}
