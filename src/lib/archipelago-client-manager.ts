import * as DC from 'discord.js'
import normalizeUrl from 'normalize-url'
import * as DB from '../db/db'
import { ArchipelagoClientWrapper, ClientState, ClientOptions } from './archipelago-client'
import { ArchipelagoRoomUrl, type ArchipelagoRoomData } from '../types/archipelago-types'
import { ArchipelagoEventFormatter } from './archipelago-event-formatter'

export enum StartClientStatus {
  Success,
  Failed,
  AlreadyRunning,
}

export class ArchipelagoClientManager {
  private #clients = new Map<DC.Snowflake, ArchipelagoClientWrapper>
  private #multiworlds: DB.DBActiveMultiworld[] = []

  private #defaultEventFormatter: ArchipelagoEventFormatter

  constructor(defaultEventfFormatter: ArchipelagoEventFormatter) {
    this.#defaultEventFormatter = defaultEventfFormatter
  }

  async initFromDb(discordClient: DC.Client) {
    const multiworlds = await DB.getActiveMultiworlds()
    for (const { guildId, channelId, roomData, createdAt } of multiworlds) {
      const guild = await discordClient.guilds.fetch(guildId)
      if (!guild) throw new Error(`Failed to find guild with id (${guildId})`);
      const channel = await guild.channels.fetch(channelId)
      if (!channel) throw new Error(`Failed to find channel with id (${channelId}) in guild "${guild.name}" (${guildId})`);
      const whitelistedMessageTypes = await DB.getWhitelistedMessageTypes(guildId) ?? undefined
      const client = await this.createClient(
        channel,
        roomData,
        { whitelistedMessageTypes, enableGameIcons: true, enableItemIcons: true, hideFoundHints: true }
      )
      client.createdAt = createdAt
    }
    this.#multiworlds = multiworlds
  }

  // Starts clients that aren't started, skipping already running clients.
  // Will not start clients with previous error.
  async startAllClients() {
    for (const client of this.#clients.values()) {
      if (client.state === ClientState.Stopped) {
        await client.start()
      }
    }
  }

  isChannelOfExistingMultiworld(channelId: DC.Snowflake) {
    return this.#clients.has(channelId)
  }

  isRoomUrlOfExistingMultiworld(roomUrl: ArchipelagoRoomUrl) {
    const normalizedInputUrl = normalizeUrl(roomUrl.url, { forceHttps: true })
    for (const multiworld of this.#multiworlds) {
      const normalizedMultiworldUrl = normalizeUrl(multiworld.roomData.roomUrl, { forceHttps: true })
      if (normalizedInputUrl === normalizedMultiworldUrl) return true
    }
    return false
  }

  getChannelIdFromRoomUrl(roomUrl: ArchipelagoRoomUrl) {
    const normalizedInputUrl = normalizeUrl(roomUrl.url, { forceHttps: true })
    for (const multiworld of this.#multiworlds) {
      const normalizedMultiworldUrl = normalizeUrl(multiworld.roomData.roomUrl, { forceHttps: true })
      if (normalizedInputUrl === normalizedMultiworldUrl) return multiworld.channelId;
    }
    return null
  }

  async createClient(channel: DC.GuildBasedChannel, roomData: ArchipelagoRoomData, options?: ClientOptions) {
    const archClient = await ArchipelagoClientWrapper.makeClient(
      channel,
      roomData,
      { eventFormatter: this.#defaultEventFormatter },
      options,
    )

    this.#clients.set(channel.id, archClient)
    const existingMultiworld = DB.findActiveMultiworld(channel.guildId, channel.id)
    if (existingMultiworld) {
      this.#multiworlds.push(existingMultiworld)
    } else {
      const newMultiworld = await DB.addActiveMultiworld(channel.guildId, channel.id, roomData)
      this.#multiworlds.push(newMultiworld)
    }
    return archClient
  }

  async startClient(channelId: DC.Snowflake) {
    const archClient = this.#clients.get(channelId)
    if (archClient === undefined) throw new Error(`No client found for channel id (${channelId})`);
    if (archClient.state === ClientState.Running) return StartClientStatus.AlreadyRunning;
    const isSuccessful = await archClient.start()
    if (isSuccessful) return StartClientStatus.Success;
    return StartClientStatus.Failed
  }

  // Will not send a message if client is not running.
  async sendMessage(channelId: DC.Snowflake, message: string) {
    const archClient = this.#clients.get(channelId)
    if (archClient === undefined) throw new Error(`No client found for channel id (${channelId})`);
    if (archClient.state !== ClientState.Running) return;
    await archClient.sendMessage(message)
  }
}
