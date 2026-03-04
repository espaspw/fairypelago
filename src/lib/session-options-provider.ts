import { IGuildSettingsRepository } from '../db/interfaces.js'
import { ISessionRepository } from '../db/interfaces.js'
import { SessionOptions } from '../types/session-types.js'
import { IOptionsProvider } from './interfaces/options-provider.js'

/* Wraps the settings repo for setting and getting options,
providing an additional caching layer over db calls */
export class SessionOptionsProvider implements IOptionsProvider {
  constructor(
    private sessionRepo: ISessionRepository,
    private settingsRepo: IGuildSettingsRepository,
  ) { }

  async getOptions(sessionId: number): Promise<SessionOptions> {
    const session = await this.sessionRepo.findSessionById(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found.`);
    const guildSettings = await this.settingsRepo.getSettings(session.guildId)
    return guildSettings.sessionOptions
  }
}
