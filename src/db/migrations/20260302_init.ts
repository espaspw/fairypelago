import { Kysely } from 'kysely'

export async function up (db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('sessions')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('guildId', 'text', (col) => col.notNull())
    .addColumn('channelId', 'text', (col) => col.notNull())
    .addColumn('roomData', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('expiredAt', 'text')
    .execute()

  await db.schema
    .createTable('guild_settings')
    .addColumn('guildId', 'text', (col) => col.primaryKey())
    .addColumn('logChannelId', 'text')
    .addColumn('commandPrefix', 'text', (col) => col.notNull())
    .addColumn('sessionCommandPrefix', 'text', (col) => col.notNull())
    .addColumn('sessionOptions', 'text', (col) => col.notNull())
    .addColumn('playerEmojis', 'text', (col) => col.notNull())
    .execute()
}

export async function down (db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('sessions').execute()
  await db.schema.dropTable('guild_settings').execute()
}
