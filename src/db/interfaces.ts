import { ArchipelagoRoomData } from '../types/archipelago-types.js'
import { SessionOptions } from '../types/session-types.js'

export interface DBSession {
  id: number;
  guildId: string;
  channelId: string;
  roomData: ArchipelagoRoomData;
  createdAt: Date;
  expiredAt: Date | null;
}

export interface GetSessionsOptions {
  includeExpired?: boolean;
}

export interface ISessionRepository {
  addSession(guildId: string, channelId: string, roomData: ArchipelagoRoomData): Promise<number>;
  removeSession(channelId: string): Promise<void>;
  removeSessionById(sessionId: number): Promise<void>;
  getSessions(options?: GetSessionsOptions): Promise<DBSession[]>;
  setSessionExpired(sessionId: number): Promise<void>;
  findSession(channelId: string): Promise<DBSession | null>;
  findSessionById(sessionId: number): Promise<DBSession | null>;
}

export interface DBGuildSettings {
  guildId: string;
  logChannelId: string | null;
  commandPrefix: string;
  sessionCommandPrefix: string;
  sessionOptions: SessionOptions;
  playerEmojis: Record<string, string>;
}

export interface IGuildSettingsRepository {
  getSettings(guildId: string): Promise<DBGuildSettings>;
  setPrefix(guildId: string, prefix: string): Promise<void>;
  setSessionPrefix(guildId: string, prefix: string): Promise<void>;
  setLogChannel(guildId: string, channelId: string): Promise<void>;
  setSessionOptions(guildId: string, sessionOptions: SessionOptions): Promise<void>;
  setPlayerEmojis(guildId: string, playerEmojis: Record<string, string>): Promise<void>;
}
