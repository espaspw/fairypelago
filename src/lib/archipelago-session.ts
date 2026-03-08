import { Client as ArchipelagoClient } from 'archipelago.js'

import { ArchipelagoMessageType, type ArchipelagoRoomData } from '../types/archipelago-types.js'
import { catchAndLogError } from './util/general.js'
import { logger } from './util/logger.js'
import { IEventHandler } from './interfaces/event-handler.js'
import { IOptionsProvider } from './interfaces/options-provider.js'
import { ArchipelagoWebhostClient, WebhostInitialSessionData, WebhostSessionStatus } from './archipelago-webhost-client.js'
import { ItemTier } from '../types/icon-types.js'
import { TTLCache } from './util/ttl-cache.js'
import { SessionStaticState, SessionHintingInfo, SessionItemReceived, SessionStatus } from '../types/session-types.js'

interface SessionVesselChange {
  isInTransition: boolean,
  prevVesselName: string | null,
}

export interface SessionDeps {
  eventHandler: IEventHandler;
  optionsProvider: IOptionsProvider;
}

function extractToStaticState (initialData: WebhostInitialSessionData): SessionStaticState {
  return {
    trackerId: initialData.trackerId,
    players: initialData.players.map(player => ({
      slotId: player.slotId,
      slotName: player.slotName,
      download: player.download,
      team: player.team,
      game: {
        name: player.game,
        totalLocations: initialData.games.find(game => game.slotId === player.slotId)?.totalLocations ?? 0,
      },
    }))
  }
}

function parseNetworkItemFlags (flags: number): ItemTier[] {
  const tiers: ItemTier[] = []
  if (flags & 0b001) tiers.push('progression')
  if (flags & 0b010) tiers.push('useful')
  if (flags & 0b100) tiers.push('trap')
  if (flags === 0) tiers.push('filler')
  return tiers
}

function extractToSessionStatus (client: ArchipelagoClient, staticState: SessionStaticState, data: WebhostSessionStatus): SessionStatus {
  const checksDone: Record<number, string[]> = {}
  for (const [_slotId, locationIds] of Object.entries(data.checksDone)) {
    const slotId = Number.parseInt(_slotId)
    const gameName = staticState.players.find(p => p.slotId === slotId)?.game.name ?? ''
    checksDone[slotId] = []
    for (const locationId of locationIds) {
      const locationName = client.package.lookupLocationName(gameName, locationId)
      checksDone[slotId].push(locationName)
    }
  }
  const itemsReceived: Record<number, SessionItemReceived[]> = {}
  for (const [_slotId, networkItems] of Object.entries(data.itemsReceived)) {
    const slotId = Number.parseInt(_slotId)
    const items = networkItems.map<SessionItemReceived>(nItem => {
      const senderData = staticState.players.find(p => p.slotId === nItem.player)
      const senderName = senderData?.slotName ?? 'Unknown'
      const senderGame = senderData?.game.name ?? ''
      return {
        name: client.package.lookupItemName(senderGame, nItem.item),
        location: client.package.lookupLocationName(senderGame, nItem.location),
        sender: senderName,
        tiers: parseNetworkItemFlags(nItem.flags),
      }
    })

    itemsReceived[slotId] = items
  }
  return {
    port: data.port,
    lastRoomActivity: data.lastRoomActivity,
    lastPlayerActivity: data.lastPlayerActivity,
    lastPlayerConnection: data.lastPlayerConnection,
    checksDone,
    itemsReceived,
    aliases: data.aliases,
    playerStatus: data.playerStatus,
  }
}

export class ArchipelagoSession {
  readonly #sessionId: number
  #client: ArchipelagoClient
  #webhostClient: ArchipelagoWebhostClient
  #roomData: ArchipelagoRoomData
  #eventHandler: IEventHandler
  #optionsProvider: IOptionsProvider
  #staticState: SessionStaticState

  // Calls to current status endpoint are cached due to long overhead
  // Inflight prevents duplicate calls while waiting on the network for the first call
  #dynamicStateCache = new TTLCache<SessionStatus>(20000)
  #inflightStatusFetch: Promise<SessionStatus | null> | null = null

  #prevVesselChange: SessionVesselChange = {
    isInTransition: false,
    prevVesselName: null,
  }

  // Tracks recent goals by slotId to prevent item release spam
  #goalCache = new Set<number>()

  private constructor (
    sessionId: number,
    client: ArchipelagoClient,
    webhostClient: ArchipelagoWebhostClient,
    roomData: ArchipelagoRoomData,
    staticState: SessionStaticState,
    deps: SessionDeps
  ) {
    this.#sessionId = sessionId
    this.#client = client
    this.#webhostClient = webhostClient
    this.#roomData = roomData
    this.#staticState = staticState
    this.#eventHandler = deps.eventHandler
    this.#optionsProvider = deps.optionsProvider
  }

  static async makeSession (
    sessionId: number,
    roomData: ArchipelagoRoomData,
    deps: SessionDeps
  ) {
    const client = new ArchipelagoClient()
    const webhostClient = new ArchipelagoWebhostClient(roomData.domain)
    const initialSessionData = await webhostClient.fetchInitialSessionData(roomData.roomId)
    if (!initialSessionData) return null
    const staticState = extractToStaticState(initialSessionData)

    const session = new this(sessionId, client, webhostClient, roomData, staticState, deps)
    session.attachListeners()
    return session
  }

  async start () {
    // TODO: Return more robust failure types instead of boolean
    // TODO: Add logic for handing player logins with passwords
    const sessionStatus = await this.#webhostClient.fetchSessionStatus(this.#roomData.roomId)
    if (!sessionStatus) {
      logger.warn(
        'Failed to get session status when starting archipelago session',
        { roomId: this.#roomData.roomId, sessionId: this.#sessionId }
      )
      return false
    }
    try {
      const url = `${this.#roomData.domain}:${sessionStatus.port}`
      const vessel = this.#staticState.players[0].slotName
      await this.#client.login(
        url,
        vessel,
        undefined,
        { tags: ['Discord', 'Tracker', 'TextOnly'] }
      )
      logger.info('Started websocket connection to AP server', {
        sessionId: this.#sessionId,
        vessel,
        url,
      })

      // Populate data package cache with current game packages
      await this.#client.package.fetchPackage()

      await this.#eventHandler.socketConnected(this)
      return true
    } catch (err) {
      logger.warn('Failed to start archipelago session', { error: err, sessionId: this.#sessionId })
      // if (err instanceof LoginError) {

      // } else if (err instanceof SocketError) {

      // } else {

      // }
      return false
    }
  }

  async changeVessel (slotName: string) {
    const currentVessel = this.getCurrentVessel()
    if (slotName === currentVessel) {
      return false
    }
    const isExistingPlayer = this.#staticState.players.find(p => p.slotName === slotName)
    if (!isExistingPlayer) {
      return false
    }
    const sessionStatus = await this.#webhostClient.fetchSessionStatus(this.#roomData.roomId)
    if (!sessionStatus) {
      logger.warn(
        'Failed to get session status when changing vessels',
        { roomId: this.#roomData.roomId, sessionId: this.#sessionId }
      )
      return false
    }
    const newClient = new ArchipelagoClient()
    try {
      await newClient.login(
        `${this.#roomData.domain}:${sessionStatus.port}`,
        slotName,
        undefined,
        { tags: ['Discord', 'Tracker', 'TextOnly'] }
      )
      const oldClient = this.#client
      this.#prevVesselChange = {
        isInTransition: true,
        prevVesselName: currentVessel
      }
      oldClient.socket.disconnect()
      this.#client = newClient
      this.attachListeners()

      logger.info('Successfully changed vessel', {
        sessionId: this.#sessionId,
        oldVessel: currentVessel,
        newVessel: slotName,
      })
      return true
    } catch (err) {
      logger.warn('Failed to change vessel', {
        sessionId: this.#sessionId,
        oldVessel: currentVessel,
        newVessel: slotName,
        error: err,
      })
      return false
    }
  }

  async dispose () {
    if (this.isSocketConnected) {
      await this.#eventHandler.botShutdown(this)
    }
  }

  async getCurrentStatus () {
    const cached = this.#dynamicStateCache.get()
    if (cached) return cached

    if (this.#inflightStatusFetch) {
      return this.#inflightStatusFetch
    }

    this.#inflightStatusFetch = (async () => {
      try {
        const status = await this.#webhostClient.fetchSessionStatus(this.#roomData.roomId)
        if (!status) return null

        // Populate the data packages in cache there is no cached version and this is called before start()
        this.#client.package.fetchPackage()

        const finalStatus = extractToSessionStatus(this.#client, this.#staticState, status)
        this.#dynamicStateCache.set(finalStatus)
        return finalStatus
      } finally {
        this.#inflightStatusFetch = null
      }
    })()

    return this.#inflightStatusFetch
  }

  // Fetches player hints. If null, slotName likely doesn't exist
  async getPlayerHints (slotName: string) {
    const slotId = this.#staticState.players.find(p => p.slotName === slotName)?.slotId
    if (!slotId) return null
    const player = this.#client.players.findPlayer(slotId)
    // Shouldn't happen but in case staticState and websocket state is desynced
    if (!player) return null
    const hints = await player.fetchHints()
    const { hideFoundHints } = await this.#optionsProvider.getOptionsBySessionId(this.#sessionId)
    if (hideFoundHints) {
      return hints.filter(hint => !hint.found)
    }
    return hints
  }

  // Returns hinting info ONLY for the current vessel
  async getHintingInfo (): Promise<SessionHintingInfo | null> {
    const currentVessel = this.getCurrentVessel()
    if (!currentVessel) return null
    return {
      vesselName: currentVessel,
      hintCost: this.#client.room.hintCost,
      hintCostPercentage: this.#client.room.hintCostPercentage,
      hintPoints: this.#client.room.hintPoints,
    }
  }

  getCurrentVessel () {
    if (!this.isSocketConnected) return null
    return this.#client.name
  }

  get staticState () {
    return this.#staticState
  }

  get roomData () {
    return this.#roomData
  }

  get sessionId () {
    return this.#sessionId
  }

  get isSocketConnected () {
    return this.#client.socket.connected
  }

  async sendMessage (message: string) {
    if (this.isSocketConnected) {
      await this.#client.messages.say(message)
    }
  }

  async #isWhitelisted (msgType: ArchipelagoMessageType) {
    const options = await this.#optionsProvider.getOptionsBySessionId(this.#sessionId)
    return options.whitelistedMessageTypes.includes(msgType)
  }

  #isEveryoneGoaled (sessionStatus: SessionStatus) {
    return Object.values(sessionStatus?.playerStatus).every(s => s === 'Goaled')
  }

  attachListeners () {
    this.#client.socket.on('disconnected', async () => {
      if (this.#prevVesselChange.isInTransition) {
        this.#prevVesselChange.isInTransition = false
      } else {
        await this.#eventHandler.socketDisconnected(this)
      }
    })

    this.#client.socket.on('invalidPacket', (packet) => {
      logger.warn('AP Websocket received invalid packet.', {
        sessionId: this.#sessionId, packetType: packet.type, packetText: packet.text,
      })
    })

    this.#client.messages.on('connected', catchAndLogError(async (text, player, tags) => {
      if (!await this.#isWhitelisted(ArchipelagoMessageType.Connected)) return
      const status = await this.getCurrentStatus()
      if (status && this.#isEveryoneGoaled(status)) {
        await this.#eventHandler.allGoaled(this)
      }
      await this.#eventHandler.connected(this, text, player, tags)
    }))

    this.#client.messages.on('disconnected', catchAndLogError(async (text, player) => {
      if (!await this.#isWhitelisted(ArchipelagoMessageType.Disconnected)) return
      if (this.#prevVesselChange.prevVesselName === player.name) {
        this.#prevVesselChange.prevVesselName = null
        return
      }
      await this.#eventHandler.disconnected(this, text, player)
    }))

    this.#client.messages.on('itemSent', catchAndLogError(async (text, item) => {
      if (this.#goalCache.has(item.sender.slot) && !item.progression) return
      if (item.progression && !this.#isWhitelisted(ArchipelagoMessageType.ItemSentProgression)) return
      if (item.useful && !item.progression && !this.#isWhitelisted(ArchipelagoMessageType.ItemSentUseful)) return
      if (item.filler && !this.#isWhitelisted(ArchipelagoMessageType.ItemSentFiller)) return
      if (item.trap && !this.#isWhitelisted(ArchipelagoMessageType.ItemSentTrap)) return
      await this.#eventHandler.itemSent(this, text, item)
    }))

    this.#client.messages.on('itemHinted', catchAndLogError(async (text, item) => {
      if (!this.#isWhitelisted(ArchipelagoMessageType.ItemHinted)) return
      const options = await this.#optionsProvider.getOptionsBySessionId(this.#sessionId)
      if (options.hideFoundHints && text.includes('(found)')) return
      await this.#eventHandler.itemHinted(this, text, item)
    }))

    this.#client.messages.on('itemCheated', catchAndLogError(async (text, item) => {
      if (!await this.#isWhitelisted(ArchipelagoMessageType.ItemCheated)) return
      await this.#eventHandler.itemCheated(this, text, item)
    }))

    this.#client.messages.on('chat', catchAndLogError(async (message, player) => {
      if (!await this.#isWhitelisted(ArchipelagoMessageType.UserChat)) return
      await this.#eventHandler.chat(this, message, player)
    }))

    this.#client.messages.on('serverChat', catchAndLogError(async (message) => {
      if (!await this.#isWhitelisted(ArchipelagoMessageType.ServerChat)) return
      await this.#eventHandler.serverChat(this, message)
    }))

    this.#client.messages.on('userCommand', catchAndLogError(async (text) => {
      if (!await this.#isWhitelisted(ArchipelagoMessageType.UserCommand)) return
      await this.#eventHandler.userCommand(this, text)
    }))

    this.#client.messages.on('adminCommand', catchAndLogError(async (text) => {
      if (!await this.#isWhitelisted(ArchipelagoMessageType.ServerCommand)) return
      await this.#eventHandler.adminCommand(this, text)
    }))

    this.#client.messages.on('goaled', catchAndLogError(async (text, player) => {
      this.#goalCache.add(player.slot)

      if (!await this.#isWhitelisted(ArchipelagoMessageType.Goal)) return
      await this.#eventHandler.goaled(this, text, player)

      // Invalidate cache so that goal information is up to date
      this.#dynamicStateCache.invalidate()
      const status = await this.getCurrentStatus()
      if (status && this.#isEveryoneGoaled(status)) {
        await this.#eventHandler.allGoaled(this)
      }
    }))
  }
}
