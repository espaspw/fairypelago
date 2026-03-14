import { IGuildSettingsRepository } from '../db/interfaces.js'
import { ISessionRepository } from '../db/interfaces.js'
import { SessionOptions } from '../types/session-types.js'
import { IOptionsProvider } from './interfaces/options-provider.js'

type GuildId = string

/* Wraps the settings repo for setting and getting options,
providing an additional caching layer over db calls.
In the future, options in a session may be overridden by the session,
which means options by guild and session id could have different states */
export class SessionOptionsProvider implements IOptionsProvider {
  #sessionCache = new Map<GuildId, SessionOptions>()

  constructor (
    private sessionRepo: ISessionRepository,
    private settingsRepo: IGuildSettingsRepository,
  ) { }

  // Create a deep copy of the cached object to prevent later modifications
  #copySessionOptions (options: SessionOptions): SessionOptions {
    return {
      ...options,
      whitelistedMessageTypes: [...options.whitelistedMessageTypes],
    }
  }

  async getOptionsByGuildId (guildId: string): Promise<SessionOptions> {
    const cachedSession = this.#sessionCache.get(guildId)
    if (cachedSession) return cachedSession
    const guildSettings = await this.settingsRepo.getSettings(guildId)
    this.#sessionCache.set(guildId, this.#copySessionOptions(guildSettings.sessionOptions))
    return guildSettings.sessionOptions
  }

  async setOptionsByGuildId (guildId: string, options: SessionOptions): Promise<void> {
    this.#sessionCache.set(guildId, this.#copySessionOptions(options))
    await this.settingsRepo.setSessionOptions(guildId, options)
  }

  async getOptionsBySessionId (sessionId: number): Promise<SessionOptions> {
    const session = await this.sessionRepo.findSessionById(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found.`)
    return await this.getOptionsByGuildId(session.guildId)
  }

  async setOptionsBySessionId (sessionId: number, options: SessionOptions): Promise<void> {
    const session = await this.sessionRepo.findSessionById(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found.`)
    return this.setOptionsByGuildId(session.guildId, options)
  }
}
