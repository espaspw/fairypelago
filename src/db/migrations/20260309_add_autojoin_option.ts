import { Kysely } from 'kysely'

export async function up (db: Kysely<any>): Promise<void> {
  const rows = await db.selectFrom('guild_settings')
    .select(['guildId', 'sessionOptions'])
    .execute()

  for (const row of rows) {
    const options = JSON.parse(row.sessionOptions)

    if (options.enableAutojoin === undefined) {
      options.enableAutojoin = true

      await db.updateTable('guild_settings')
        .set({ sessionOptions: JSON.stringify(options) })
        .where('guildId', '=', row.guildId)
        .execute()
    }
  }
}

export async function down (db: Kysely<any>): Promise<void> {
  const rows = await db.selectFrom('guild_settings')
    .select(['guildId', 'sessionOptions'])
    .execute()

  for (const row of rows) {
    const options = JSON.parse(row.sessionOptions)

    if ('enableAutojoin' in options) {
      delete options.enableAutojoin

      await db.updateTable('guild_settings')
        .set({ sessionOptions: JSON.stringify(options) })
        .where('guildId', '=', row.guildId)
        .execute()
    }
  }
}
