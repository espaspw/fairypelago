import { SessionOptions } from '../../types/session-types.js';

export interface IOptionsProvider {
  getOptions(sessionId: number): Promise<SessionOptions>;
}
