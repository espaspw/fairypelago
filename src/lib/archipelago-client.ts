import { Client as ArchClient, DataPackage, SocketError } from 'archipelago.js'
import * as DC from 'discord.js'

import * as DB from '../db/db'
import { ArchipelagoMessageType, ItemCounts, LocationCounts, type ArchipelagoRoomData } from '../types/archipelago-types'
import { ArchipelagoEventFormatter } from './archipelago-event-formatter'
import { catchAndLogError } from './util/general'
import { consoleLogger, fileLogger } from './util/logger'

export interface ClientOptions {
  whitelistedMessageTypes: ArchipelagoMessageType[]
  enableGameIcons: boolean;
  enableItemIcons: boolean;
  hideFoundHints: boolean;
}

export const defaultWhitelistedTypes = [
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

const defaultClientOptions: ClientOptions = {
  whitelistedMessageTypes: defaultWhitelistedTypes,
  enableGameIcons: true,
  enableItemIcons: true,
  hideFoundHints: true,
}

export interface ClientDeps {
  eventFormatter: ArchipelagoEventFormatter
}

export enum ClientState {
  Stopped,
  Running,
}

export class ArchipelagoClientWrapper {
  private #client: ArchClient
  private #roomData: ArchipelagoRoomData
  private #discordChannel: DC.TextChannel | DC.PublicThreadChannel
  private #eventFormatter: ArchipelagoEventFormatter
  state: ClientState = ClientState.Stopped
  lastError: Error | null = null
  private #whitelistedTypes: Set<ArchipelagoMessageType>
  private #options: ClientOptions
  private #createdAt: Date = new Date()
  private #lastConnected: Date | null = null
  private #lastDisconnected: Date | null = null
  private #dataPackage: DataPackage | null = null

  // Quick lookups when a user goals. Mainly used to prevent
  // message spam after a goal, so persistence not needed.
  private #goalCache = new Set<string>()

  constructor(
    client: ArchClient,
    roomData: ArchipelagoRoomData,
    discordChannel: DC.TextChannel | DC.PublicThreadChannel,
    deps: ClientDeps,
    options: ClientOptions
  ) {
    this.#client = client
    this.#roomData = roomData
    this.#discordChannel = discordChannel
    this.#eventFormatter = deps.eventFormatter
    this.#whitelistedTypes = new Set(options.whitelistedMessageTypes)
    this.#options = options
  }

  static async makeClient(
    channel: DC.TextChannel | DC.PublicThreadChannel,
    roomData: ArchipelagoRoomData,
    deps: ClientDeps,
    options?: ClientOptions = defaultClientOptions,
  ) {
    const client = new ArchClient()
    const wrapper = new this(client, roomData, channel, deps, options)
    wrapper.attachListeners()
    return wrapper
  }

  isWhitelisted(msgType: ArchipelagoMessageType) {
    return this.#whitelistedTypes.has(msgType)
  }

  addWhitelistType(...msgType: ArchipelagoMessageType[]) {
    msgType.forEach(this.#whitelistedTypes.add)
  }

  removeWhitelistType(...msgType: ArchipelagoMessageType[]) {
    msgType.forEach(this.#whitelistedTypes.delete)
  }

  async start() {
    try {
      await this.#client.login(
        `archipelago.gg:${this.#roomData.port}`,
        this.#roomData.players[0].name,
        null,
        { tags: ['Discord', 'Tracker', 'TextOnly'] },
      )
      this.state = ClientState.Running
      const logMessage = `Successfully connected to Archipelago server (${this.#roomData.roomUrl}, ${this.#createdAt.toLocaleString()}) with (${this.#discordChannel.id})`
      consoleLogger.info(logMessage)
      fileLogger.info(logMessage)
      await this.fetchPackage()
      this.#lastConnected = new Date()
      await DB.setLastConnected(this.#discordChannel.guildId, this.#discordChannel.id, this.#lastConnected)
      return true
    } catch (err) {
      if (err instanceof SocketError && err.message.includes('Failed to connect to Archipelago server.')) {
        const logMessage = `Failed to connect to Archipelago server (${this.#roomData.roomUrl}, ${this.#createdAt.toLocaleString()}) connected to channel (${this.#discordChannel.id})`
        consoleLogger.info(logMessage)
        fileLogger.info(logMessage)
        this.lastError = err
      }
      this.state = ClientState.Stopped
      return false
    }
  }

  async fetchPackage(forceUpdate = false) {
    if (this.state !== ClientState.Running) return this.#dataPackage;
    if (!forceUpdate && this.#dataPackage) {
      return this.#dataPackage
    }
    const dataPackage = await this.#client.package.exportPackage()
    this.#dataPackage = dataPackage
    return dataPackage
  }

  getGameList() {
    if (!this.#dataPackage) return [];
    return Object.keys(this.#dataPackage.games)
  }

  getItemList(gameName: string) {
    if (!this.#dataPackage) return [];
    const gamePackage = this.#dataPackage.games[gameName]
    if (!gamePackage) return [];
    return Object.keys(this.#dataPackage.games[gameName]['item_name_to_id'])
  }

  getLocationList(gameName: string) {
    if (!this.#dataPackage) return [];
    const gamePackage = this.#dataPackage.games[gameName]
    if (!gamePackage) return [];
    return Object.keys(this.#dataPackage.games[gameName]['location_name_to_id'])
  }

  getLocationIdToNameMap(gameName: string) {
    if (!this.#dataPackage) return [];
    const gamePackage = this.#dataPackage.games[gameName]
    if (!gamePackage) return [];
    const nameToId = this.#dataPackage.games[gameName]['location_name_to_id']
    const inverseMap: Record<number, string> = {}
    for (const [name, id] of Object.entries(nameToId)) {
      inverseMap[id] = name
    }
    return inverseMap
  }

  getMissingLocations(gameName: string) {
    const allLocationIds = this.#client.room.allLocations
    const checkedLocationIds = new Set(this.#client.room.checkedLocations)
    const locationIdToNames = this.getLocationIdToNameMap(gameName)
    const missingLocations: string[] = []
    for (const id of allLocationIds) {
      if (checkedLocationIds.has(id)) continue;
      const name = locationIdToNames[id]
      if (!name) continue;
      missingLocations.push(name)
    }
    return missingLocations
  }

  getItemCounts() {
    if (!this.#dataPackage) return {};
    const output: ItemCounts = {}
    const games = this.getGameList()
    for (const game of games) {
      output[game] = this.getItemList(game)?.length ?? 0
    }
    return output
  }

  getLocationCounts() {
    if (!this.#dataPackage) return {};
    const output: LocationCounts = {}
    const games = this.getGameList()
    for (const game of games) {
      output[game] = this.getLocationList(game)?.length ?? 0
    }
    return output
  }

  get createdAt() {
    return this.#createdAt
  }

  set createdAt(_createdAt: Date) {
    this.#createdAt = _createdAt
  }

  get lastConnected(): Date | null {
    return this.#lastConnected
  }

  set lastConnected(_lastConnected: Date) {
    this.#lastConnected = _lastConnected
  }

  get lastDisconnected(): Date | null {
    return this.#lastDisconnected
  }

  set lastDisconnected(_lastDisconnected: Date) {
    this.#lastConnected = _lastDisconnected
  }

  get client() {
    return this.#client
  }

  set client(cilent: ArchClient) {
    this.#client = cilent
  }

  get channel() {
    return this.#discordChannel
  }

  async sendMessage(message: string) {
    await this.#client.messages.say(message)
  }

  attachListeners() {
    this.#client.socket.on('disconnected', async () => {
      fileLogger.warn(`Websocket for client on channel (${this.#discordChannel.id}) disconnected.`)
      this.state = ClientState.Stopped
      this.#lastDisconnected = new Date()
      await this.#discordChannel.send('Connection to server ended. I\'ll periodically attempt to reconnect, or tell me "restart" to attempt it any time.')
      await DB.setLastConnected(this.#discordChannel.guildId, this.#discordChannel.id, this.#lastDisconnected)
    })

    this.#client.socket.on('invalidPacket', (packet) => {
      this.lastError = new Error(`Websocket encountered invalid packet: Packet(type: ${packet.type}, text: ${packet.text}))}`)
      fileLogger.warn(`Websocket for client on channel (${this.#discordChannel.id}) had invalid packet: Packet(type: ${packet.type}, text: ${packet.text}))`)
    })

    this.#client.messages.on('connected', catchAndLogError(async (content, player, tags) => {
      if(!this.isWhitelisted(ArchipelagoMessageType.Connected)) return;
      const responseMsg = this.#eventFormatter.connected(content, player, tags)
      if (responseMsg === null) return;
      await this.#discordChannel.send(responseMsg)
    }))

    this.#client.messages.on('disconnected', catchAndLogError(async (content, player) => {
      if(!this.isWhitelisted(ArchipelagoMessageType.Disconnected)) return;
      await this.#discordChannel.send(this.#eventFormatter.disconnected(content, player))
    }))

    this.#client.messages.on('itemSent', catchAndLogError(async (content, item) => {
      if (item.progression && !this.isWhitelisted(ArchipelagoMessageType.ItemSentProgression)) return;
      if (item.useful && !item.progression && !this.isWhitelisted(ArchipelagoMessageType.ItemSentUseful)) return;
      if (item.filler && !this.isWhitelisted(ArchipelagoMessageType.ItemSentFiller)) return;
      if (item.trap && !this.isWhitelisted(ArchipelagoMessageType.ItemSentTrap)) return;
      // TODO: Make this configurable in formatter settings
      if (this.#goalCache.has(item.sender.alias) && !item.progression) return;
      if (this.#goalCache.has(item.receiver.alias)) return;
      await this.#discordChannel.send(this.#eventFormatter.itemSent(content, item))
    }))

    this.#client.messages.on('itemHinted', catchAndLogError(async (content, item) => {
      if (!this.isWhitelisted(ArchipelagoMessageType.ItemHinted)) return;
      if (this.#options.hideFoundHints && content.includes('(found)')) return;
      await this.#discordChannel.send(this.#eventFormatter.itemHinted(content, item))
    }))

    this.#client.messages.on('itemCheated', catchAndLogError(async (content, item) => {
      if (!this.isWhitelisted(ArchipelagoMessageType.ItemCheated)) return;
      await this.#discordChannel.send(this.#eventFormatter.itemCheated(content, item))
    }))

    this.#client.messages.on('chat', catchAndLogError(async (content, player) => {
      if(!this.isWhitelisted(ArchipelagoMessageType.UserChat)) return;
      const responseMsg = this.#eventFormatter.chat(content, player)
      if (responseMsg === null) return;
      await this.#discordChannel.send(responseMsg)
    }))
    
    this.#client.messages.on('serverChat', catchAndLogError(async (content) => {
      if(!this.isWhitelisted(ArchipelagoMessageType.ServerChat)) return;
      await this.#discordChannel.send(this.#eventFormatter.serverChat(content))
    }))

    this.#client.messages.on('userCommand', catchAndLogError(async (content) => {
      if(!this.isWhitelisted(ArchipelagoMessageType.UserCommand)) return;
      await this.#discordChannel.send(this.#eventFormatter.userCommand(content))
    }))

    this.#client.messages.on('adminCommand', catchAndLogError(async (content) => {
      if(!this.isWhitelisted(ArchipelagoMessageType.ServerCommand)) return;
      await this.#discordChannel.send(this.#eventFormatter.adminCommand(content))
    }))

    this.#client.messages.on('goaled', catchAndLogError(async (content, player) => {
      if(!this.isWhitelisted(ArchipelagoMessageType.Goal)) return;
      this.#goalCache.add(player.name)
      await this.#discordChannel.send(this.#eventFormatter.goaled(content, player))
    }))
  }
}
