import { Kysely } from 'kysely'
import { DatabaseSchema } from '../schema.js'
import { INotificationRequestsRepository, DBNotificationRequest } from '../interfaces.js'

export class SqliteNotificationRequestsRepository implements INotificationRequestsRepository {
  constructor (private db: Kysely<DatabaseSchema>) {}

  async addNotification (notification: Omit<DBNotificationRequest, 'id'>): Promise<number> {
    const result = await this.db
      .insertInto('notification_requests')
      .values({
        sessionId: notification.sessionId,
        discordId: notification.discordId,
        targetPlayerSlotId: notification.targetPlayerSlotId,
        targetItemName: notification.targetItemName,
        createdAt: new Date().toISOString(),
      })
      .returning('id')
      .executeTakeFirstOrThrow()
    return result.id
  }

  async removeNotification (id: number): Promise<void> {
    await this.db
      .deleteFrom('notification_requests')
      .where('id', '=', id)
      .execute()
  }

  async getNotificationsForUser (sessionId: number, discordId: string): Promise<DBNotificationRequest[]> {
    return await this.db
      .selectFrom('notification_requests')
      .selectAll()
      .where('sessionId', '=', sessionId)
      .where('discordId', '=', discordId)
      .execute()
  }

  async findMatches (sessionId: number, slot: number, itemName: string): Promise<DBNotificationRequest[]> {
    return await this.db
      .selectFrom('notification_requests')
      .selectAll()
      .where('sessionId', '=', sessionId)
      .where('targetPlayerSlotId', '=', slot)
      .where('targetItemName', '=', itemName)
      .execute()
  }
}
