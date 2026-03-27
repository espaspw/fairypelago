import 'dotenv/config'
import { Kysely, ParseJSONResultsPlugin, SqliteDialect } from 'kysely'
import SQLite from 'better-sqlite3'

import { DiscordClient } from './lib/discord-client.js'
import * as IconLookupTable from './lib/icon-lookup-table.js'
import { gameIcons, itemIcons, itemTierIcons } from './data/icons.js'
import { loadJobs, scheduleJobs } from './lib/jobs.js'
import { logger } from './lib/util/logger.js'
import { DatabaseSchema } from './db/schema.js'
import { SqliteGuildSettingRepository } from './db/repositories/sqlite-guild-setting-repository.js'
import { SqliteSessionRepository } from './db/repositories/sqlite-session-repository.js'
import { SessionOptionsProvider } from './lib/session-options-provider.js'
import { ArchipelagoSessionRegistry } from './lib/archipelago-session-registry.js'
import { SqliteNotificationRequestsRepository } from './db/repositories/sqlite-notification-requests-repository.js'

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN

async function main () {
  if (!DISCORD_BOT_TOKEN) {
    throw new Error('DISCORD_BOT_TOKEN missing from dotenv file')
  }

  const db = new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: new SQLite('./storage/main.db'),
    }),
    plugins: [new ParseJSONResultsPlugin()],
  })

  const sessionRepo = new SqliteSessionRepository(db)
  const settingsRepo = new SqliteGuildSettingRepository(db)
  const notificationRequestsRepo = new SqliteNotificationRequestsRepository(db)

  const optionsProvider = new SessionOptionsProvider(sessionRepo, settingsRepo)
  const sessionRegistry = new ArchipelagoSessionRegistry(
    sessionRepo, settingsRepo, notificationRequestsRepo, optionsProvider,
  )

  const discordClient = new DiscordClient(
    sessionRegistry, sessionRepo, settingsRepo, notificationRequestsRepo, optionsProvider,
  )
  discordClient.registerListeners()
  await discordClient.login(DISCORD_BOT_TOKEN)

  await IconLookupTable.fetchApplicationEmojis(discordClient.client)
  IconLookupTable.populateGameIcons(gameIcons)
  IconLookupTable.populateItemIcons(itemIcons)
  IconLookupTable.populateItemTierIcons(itemTierIcons)

  await loadJobs()
  scheduleJobs(sessionRegistry, discordClient.client)

  process.on('SIGINT', () => {
    Promise.all(sessionRegistry.getAllSessions().map(session => session.dispose())).finally(() => process.exit(0))
  })
  process.on('SIGTERM', () => {
    Promise.all(sessionRegistry.getAllSessions().map(session => session.dispose())).finally(() => process.exit(0))
  })
}

main().catch((err) => {
  logger.error('Fatal error during setup', { error: err })
  process.exit(1)
})
