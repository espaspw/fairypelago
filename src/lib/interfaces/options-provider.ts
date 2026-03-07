import { SessionOptions } from '../../types/session-types.js';

export interface IOptionsProvider {
  getOptionsBySessionId(sessionId: number): Promise<SessionOptions>;
  getOptionsByGuildId(guildId: string): Promise<SessionOptions>;
  setOptionsBySessionId(sessionId: number, options: SessionOptions): Promise<void>;
  setOptionsByGuildId(guildId: string, options: SessionOptions): Promise<void>;
}
