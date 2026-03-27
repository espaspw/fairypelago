import { Kysely } from 'kysely'

export async function up (db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('notification_requests')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('sessionId', 'integer', (col) =>
      col.references('sessions.id').onDelete('cascade').notNull(),
    )
    .addColumn('discordId', 'text', (col) => col.notNull())
    .addColumn('targetPlayerSlotId', 'integer', (col) => col.notNull())
    .addColumn('targetItemName', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .execute()
}

export async function down (db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('notification_requests').execute()
}
