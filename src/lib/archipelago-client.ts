import { Client as ArchClient, SocketError } from 'archipelago.js'
import * as DC from 'discord.js'

import { ArchipelagoMessageType, type ArchipelagoRoomData } from '../types/archipelago-types'
import { ArchipelagoEventFormatter } from './archipelago-event-formatter'

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
  Failure,
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
      return true
    } catch (err) {
      if (err instanceof SocketError && err.message.includes('Failed to connect to Archipelago server.')) {
        this.state = ClientState.Failure
        this.lastError = err
      }
      this.state = ClientState.Stopped
      return false
    }
  }

  get client() {
    return this.#client
  }

  set client(cilent: ArchClient) {
    this.#client = cilent
  }

  attachListeners() {
    this.#client.messages.on('connected', async (content, player, tags) => {
      if(!this.isWhitelisted(ArchipelagoMessageType.Connected)) return;
      const responseMsg = this.#eventFormatter.connected(content, player, tags)
      if (responseMsg === null) return;
      await this.#discordChannel.send(responseMsg)
    })

    this.#client.messages.on('disconnected', async (content, player) => {
      if(!this.isWhitelisted(ArchipelagoMessageType.Disconnected)) return;
      await this.#discordChannel.send(this.#eventFormatter.disconnected(content, player))
    })

    this.#client.messages.on('itemSent', async (content, item) => {
      if (item.progression && !this.isWhitelisted(ArchipelagoMessageType.ItemSentProgression)) return;
      if (item.useful && !item.progression && !this.isWhitelisted(ArchipelagoMessageType.ItemSentUseful)) return;
      if (item.filler && !this.isWhitelisted(ArchipelagoMessageType.ItemSentFiller)) return;
      if (item.trap && !this.isWhitelisted(ArchipelagoMessageType.ItemSentTrap)) return;
      // TODO: Make this configurable in formatter settings
      if (this.#goalCache.has(item.sender.alias) && !item.progression) return;
      await this.#discordChannel.send(this.#eventFormatter.itemSent(content, item))
    })

    this.#client.messages.on('itemHinted', async (content, item) => {
      if (!this.isWhitelisted(ArchipelagoMessageType.ItemHinted)) return;
      if (this.#options.hideFoundHints && content.includes('(found)')) return;
      await this.#discordChannel.send(this.#eventFormatter.itemHinted(content, item))
    })

    this.#client.messages.on('itemCheated', async (content, item) => {
      if (!this.isWhitelisted(ArchipelagoMessageType.ItemCheated)) return;
      await this.#discordChannel.send(this.#eventFormatter.itemCheated(content, item))
    })

    this.#client.messages.on('chat', async (content, player) => {
      if(!this.isWhitelisted(ArchipelagoMessageType.UserChat)) return;
      const responseMsg = this.#eventFormatter.chat(content, player)
      if (responseMsg === null) return;
      await this.#discordChannel.send(responseMsg)
    })
    
    this.#client.messages.on('serverChat', async (content) => {
      if(!this.isWhitelisted(ArchipelagoMessageType.ServerChat)) return;
      await this.#discordChannel.send(this.#eventFormatter.serverChat(content))
    })

    this.#client.messages.on('userCommand', async (content) => {
      if(!this.isWhitelisted(ArchipelagoMessageType.UserCommand)) return;
      await this.#discordChannel.send(this.#eventFormatter.userCommand(content))
    })

    this.#client.messages.on('adminCommand', async (content) => {
      if(!this.isWhitelisted(ArchipelagoMessageType.ServerCommand)) return;
      await this.#discordChannel.send(this.#eventFormatter.adminCommand(content))
    })

    this.#client.messages.on('goaled', async (content, player) => {
      if(!this.isWhitelisted(ArchipelagoMessageType.Goal)) return;
      this.#goalCache.add(player.name)
      await this.#discordChannel.send(this.#eventFormatter.goaled(content, player))
    })
  }
}
