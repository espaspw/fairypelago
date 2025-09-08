import * as DC from 'discord.js'
import normalizeUrl from 'normalize-url'
import * as DB from '../db/db'
import { ArchipelagoClientWrapper, ClientState, ClientOptions } from './archipelago-client'
import { ArchipelagoRoomUrl, type ArchipelagoRoomData } from '../types/archipelago-types'
import { ArchipelagoEventFormatter } from './archipelago-event-formatter'
import { fileLogger } from './util/logger'

export enum StartClientStatus {
  Success,
  Failed,
  AlreadyRunning,
}

const oneWeekMs = 7 * 24 * 60 * 60 * 1000
const twoWeeksMs = 2 * oneWeekMs

function dateIsOlderThan(date: Date, ms: number) {
  return ((new Date()).getTime() - (new Date(date)).getTime()) >= ms
}

export class ArchipelagoClientManager {
  private #clients = new Map<DC.Snowflake, ArchipelagoClientWrapper>
  private #multiworlds: DB.DBActiveMultiworld[] = []

  private async #createClientFromDbMultiworld(discordClient: DC.Client, multiworld: DB.DBActiveMultiworld) {
    const { guildId, channelId, roomData, createdAt, lastConnected, lastDisconnected } = multiworld
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
    client.lastConnected = lastConnected ?? null
    client.lastDisconnected = lastDisconnected ?? null
    return client
  }

  async initFromDb(discordClient: DC.Client) {
    const multiworlds = await DB.getActiveMultiworlds()
    this.#multiworlds = multiworlds
    await Promise.all(multiworlds.map((multiworld) => this.#createClientFromDbMultiworld(discordClient, multiworld)))
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

  async removeStaleClients() {
    const staleClientChannelIds: string[] = []
    for (const client of this.#clients.values()) {
      if (client.state === ClientState.Running) {
        continue;
      }
      if (!client.lastConnected && !client.lastDisconnected && dateIsOlderThan(client.createdAt, twoWeeksMs)) {
        // If no connection dates except created at, mark stale client if created more than two weeks ago
        staleClientChannelIds.push(client.channel.id)
      } else if (client.lastConnected && !client.lastDisconnected && dateIsOlderThan(client.lastConnected, twoWeeksMs)) {
        // Either a really long running game or bot crashed during an active game and never reconnected
        staleClientChannelIds.push(client.channel.id)
      } else if (client.lastDisconnected && dateIsOlderThan(client.lastDisconnected, oneWeekMs)) {
        // Stale is last disconnected date is more than a week ago
        staleClientChannelIds.push(client.channel.id)
      }
    }

    fileLogger.info(`Removing clients with channel ids: ${staleClientChannelIds.join(',')}.`)
    for (const channelId of staleClientChannelIds) {
      this.#clients.delete(channelId)
    }
    await DB.removeActiveMultiworlds(staleClientChannelIds)
    this.#multiworlds = await DB.getActiveMultiworlds()
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
    const eventFormatter = new ArchipelagoEventFormatter(channel.guildId)

    const archClient = await ArchipelagoClientWrapper.makeClient(
      channel,
      roomData,
      { eventFormatter },
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

  getItemCounts(channelId: DC.Snowflake) {
    const archClient = this.#clients.get(channelId)
    if (archClient === undefined) throw new Error(`No client found for channel id (${channelId})`);
    const itemCounts = archClient.getItemCounts()
    return itemCounts
  }

  getItemList(channelId: DC.Snowflake, gameName?: string) {
    const archClient = this.#clients.get(channelId)
    if (archClient === undefined) throw new Error(`No client found for channel id (${channelId})`);
    return archClient.getItemList(gameName)
  }

  getLocationList(channelId: DC.Snowflake, gameName: string) {
    const archClient = this.#clients.get(channelId)
    if (archClient === undefined) throw new Error(`No client found for channel id (${channelId})`);
    return archClient.getLocationList(gameName)
  }

  getLocationCounts(channelId: DC.Snowflake) {
    const archClient = this.#clients.get(channelId)
    if (archClient === undefined) throw new Error(`No client found for channel id (${channelId})`);
    const locationCounts = archClient.getLocationCounts()
    return locationCounts
  }

  getMissingLocations(channelId: DC.Snowflake, gameName: string) {
    const archClient = this.#clients.get(channelId)
    if (archClient === undefined) throw new Error(`No client found for channel id (${channelId})`);
    return archClient.getMissingLocations(gameName)
  }

  async fetchPackage(channelId: DC.Snowflake) {
    const archClient = this.#clients.get(channelId)
    if (archClient === undefined) throw new Error(`No client found for channel id (${channelId})`);
    const dataPackage = await archClient.fetchPackage()
    return dataPackage
  }

  // Will not send a message if client is not running.
  async sendMessage(channelId: DC.Snowflake, message: string) {
    const archClient = this.#clients.get(channelId)
    if (archClient === undefined) throw new Error(`No client found for channel id (${channelId})`);
    if (archClient.state !== ClientState.Running) return false;
    await archClient.sendMessage(message)
    return true
  }

  getLastError(channelId: DC.Snowflake) {
    const archClient = this.#clients.get(channelId)
    if (archClient === undefined) throw new Error(`No client found for channel id (${channelId})`);
    return archClient.lastError
  }

  _getClients(guildId?: DC.Snowflake, channelId?: DC.Snowflake) {
    if (!guildId && !channelId) {
      return [...this.#clients.values()];
    }
    if (!guildId && channelId) {
      const archClient = this.#clients.get(channelId)
      if (archClient === undefined) return null;
      return [archClient]
    }
    if (guildId && !channelId) {
      return [...this.#clients.values()].filter(client => client.channel.guildId === guildId)
    }
    return [...this.#clients.values()].filter(client => client.channel.guildId === guildId && client.channel.id === channelId)
  }
}
