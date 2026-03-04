import { Kysely } from 'kysely'

import { DBGuildSettings, IGuildSettingsRepository } from '../interfaces.js'
import { DatabaseSchema } from '../schema.js'
import { SessionOptions } from '../../types/session-types.js'
import { ArchipelagoMessageType } from '../../types/archipelago-types.js'


const defaultWhitelistedTypes = [
  ArchipelagoMessageType.Connected,
  ArchipelagoMessageType.Disconnected,
  ArchipelagoMessageType.ItemSentProgression,
  ArchipelagoMessageType.ItemSentUseful,
  ArchipelagoMessageType.ItemSentFiller,
  ArchipelagoMessageType.ItemSentTrap,
  ArchipelagoMessageType.ItemHinted,
  ArchipelagoMessageType.ItemCheated,
  ArchipelagoMessageType.UserChat,
  ArchipelagoMessageType.ServerChat,
  ArchipelagoMessageType.Goal,
]

export class SqliteGuildSettingRepository implements IGuildSettingsRepository {
  constructor(private db: Kysely<DatabaseSchema>) { }

  async #setDefaultSettings(guildId: string): Promise<DBGuildSettings> {
    const defaults: DBGuildSettings = {
      guildId,
      logChannelId: null,
      commandPrefix: '.',
      sessionCommandPrefix: '>',
      sessionOptions: {
        enablePlayerIcons: true,
        enableGameIcons: true,
        enableItemIcons: true,
        hideFoundHints: true,
        whitelistedMessageTypes: defaultWhitelistedTypes,
      },
      playerEmojis: {},
    }
    await this.db
      .insertInto('guild_settings')
      .values({
        ...defaults,
        sessionOptions: JSON.stringify(defaults.sessionOptions),
        playerEmojis: JSON.stringify(defaults.playerEmojis),
      })
      .execute()

    return defaults
  }

  async getSettings(guildId: string): Promise<DBGuildSettings> {
    const row = await this.db
      .selectFrom('guild_settings')
      .selectAll()
      .where('guildId', '=', guildId)
      .executeTakeFirst();

    if (!row) {
      return this.#setDefaultSettings(guildId)
    } else {
      return row
    }
  }

  async setPrefix(guildId: string, prefix: string): Promise<void> {
    await this.db
      .updateTable('guild_settings')
      .set({ commandPrefix: prefix })
      .where('guildId', '=', guildId)
      .execute()
  }

  async setSessionPrefix(guildId: string, prefix: string): Promise<void> {
    await this.db
      .updateTable('guild_settings')
      .set({ sessionCommandPrefix: prefix })
      .where('guildId', '=', guildId)
      .execute()
  }

  async setLogChannel(guildId: string, channelId: string): Promise<void> {
    await this.db
      .updateTable('guild_settings')
      .set({ logChannelId: channelId })
      .where('guildId', '=', guildId)
      .execute()
  }

  async setSessionOptions(guildId: string, sessionOptions: SessionOptions): Promise<void> {
    await this.db
      .updateTable('guild_settings')
      .set({ sessionOptions: JSON.stringify(sessionOptions) })
      .where('guildId', '=', guildId)
      .execute()
  }

  async setPlayerEmojis(guildId: string, playerEmojis: Record<string, string>): Promise<void> {
    await this.db
      .updateTable('guild_settings')
      .set({ playerEmojis: JSON.stringify(playerEmojis) })
      .where('guildId', '=', guildId)
      .execute()
  }
}