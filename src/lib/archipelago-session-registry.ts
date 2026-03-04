import * as DC from 'discord.js'

import { IGuildSettingsRepository, ISessionRepository } from '../db/interfaces.js'
import { ArchipelagoRoomData } from '../types/archipelago-types.js'
import { ArchipelagoSession } from './archipelago-session.js'
import { logger } from './util/logger.js'
import { IOptionsProvider } from './interfaces/options-provider.js'
import { EventToDiscordHandler } from './event-to-discord-handler.js'
import { EventToDiscordFormatter } from './event-to-discord-formatter.js'

export class ArchipelagoSessionRegistry {
  #sessions = new Map<number, ArchipelagoSession>()
  #channelToId = new Map<DC.Snowflake, number>()
  #idToChannel = new Map<number, DC.Snowflake>()

  constructor(
    private sessionRepo: ISessionRepository,
    private settingsRepo: IGuildSettingsRepository,
    private optionsProvider: IOptionsProvider,
  ) { }

  async initFromDb(discordClient: DC.Client) {
    logger.info(`Initializing session registry from database`)
    const existingSessions = await this.sessionRepo.getSessions()
    for (const session of existingSessions) {
      try {
        const channel = await discordClient.channels.fetch(session.channelId)
        if (!channel) {
          logger.warn(
            `Could not find channel for session, skipping`,
            { channelId: session.channelId, sessionId: session.id },
          )
          continue;
        }
        if (!(channel.type === DC.ChannelType.PublicThread || channel.type === DC.ChannelType.GuildText)) {
          logger.warn(
            `Found channel for session but wasn't guild text or public thread channel`,
            { channelId: session.channelId, sessionId: session.id },
          )
          continue;
        }

        const newSession = await this.#createSessionInstance(session.id, channel, session.roomData)
        // TODO: What to do if this call fails?
        if (!newSession) continue;
        this.#sessions.set(session.id, newSession)
        this.#channelToId.set(channel.id, session.id)
        this.#idToChannel.set(session.id, channel.id)
        logger.info(
          `Initialized existing session from db in registry`,
          { sessionId: session.id, roomData: session.roomData, channelId: channel.id },
        )
      } catch (err) {
        logger.error('Failed to initialize session into registry from db', { error: err })
      }
    }
  }

  getSessionByChannelId(channelId: DC.Snowflake): ArchipelagoSession | null {
    const id = this.#channelToId.get(channelId);
    if (!id) return null
    return this.#sessions.get(id) ?? null;
  }

  getSession(sessionId: number): ArchipelagoSession | null {
    return this.#sessions.get(sessionId) ?? null
  }

  getAllSessions(): ArchipelagoSession[] {
    return [...this.#sessions.values()]
  }

  getChannelIdByRoomUrl(roomUrl: string): DC.Snowflake | null {
    const sessionId = (() => {
      for (const [sessionId, session] of this.#sessions.entries()) {
        if (session.roomData.url === roomUrl) return sessionId
      }
      return null
    })()
    if (!sessionId) return null;
    return this.#idToChannel.get(sessionId) ?? null
  }

  async createSession(channel: DC.TextChannel | DC.ThreadChannel, roomData: ArchipelagoRoomData) {
    const sessionId = await this.sessionRepo.addSession(channel.guildId, channel.id, roomData)
    const newSession = await this.#createSessionInstance(sessionId, channel, roomData)
    if (!newSession) return null
    this.#sessions.set(sessionId, newSession)
    this.#channelToId.set(channel.id, sessionId)
    this.#idToChannel.set(sessionId, channel.id)
    logger.info(`Created new session in registry`, { sessionId, roomData, channelId: channel.id })
    return newSession
  }

  /* Create an ArchipelagoSession instance representing a new or existing session from the database */
  async #createSessionInstance(sessionId: number, channel: DC.TextChannel | DC.ThreadChannel, roomData: ArchipelagoRoomData) {
    const eventFormatter = new EventToDiscordFormatter(channel.guildId, this.settingsRepo)
    const eventHandler = new EventToDiscordHandler(sessionId, {
      discordChannel: channel, formatter: eventFormatter, sessionRepo: this.sessionRepo,
    })
    return await ArchipelagoSession.makeSession(sessionId, roomData, {
      eventHandler,
      optionsProvider: this.optionsProvider,
    })
  }

  async removeSession(sessionId: number) {
    const channelIdToRemove = this.#idToChannel.get(sessionId)
    const session = await this.#sessions.get(sessionId)
    if (!session || !channelIdToRemove) {
      logger.warn(`Failed to find session or channel id when removing session in registry`, { sessionId })
      return;
    }

    try {
      await this.sessionRepo.removeSessionById(sessionId)
    } catch (err) {
      logger.warn(`Failed to remove session from db`, { sessionId, channelId: channelIdToRemove, error: err })
      return;
    }

    session.dispose()
    this.#sessions.delete(sessionId)
    this.#idToChannel.delete(sessionId)
    this.#channelToId.delete(channelIdToRemove)
  }
}
