import 'dotenv/config'

import * as DC from 'discord.js'
import normalizeUrl from 'normalize-url'

import {
  parseArchipelagoRoomUrl,
  getRoomData,
} from './lib/archipelago-room-scrape'
import { ArchipelagoRoomUrl, type ArchipelagoRoomData } from './types/archipelago-types'
import * as DB from './db/db'
import { ArchipelagoClientWrapper, ClientOptions, ClientState, defaultWhitelistedTypes, makeClient } from './lib/archipelago-client'
import { ArchipelagoMessageType } from './types/archipelago-types'
import { createRoomDataDisplay } from './lib/discord-formatting'

class ArchipelagoClientManager {
  private #clients = new Map<DC.Snowflake, ArchipelagoClientWrapper>
  private #multiworlds: DB.DBActiveMultiworld[] = []

  async initFromDb(discordClient: DC.Client) {
    const multiworlds = await DB.getActiveMultiworlds()
    for (const { guildId, channelId, roomData } of multiworlds) {
      const guild = await discordClient.guilds.fetch(guildId)
      if (!guild) throw new Error(`Failed to find guild with id (${guildId})`);
      const channel = await guild.channels.fetch(channelId)
      if (!channel) throw new Error(`Failed to find channel with id (${channelId}) in guild "${guild.name}" (${guildId})`);
      const whitelistedMessageTypes = await DB.getWhitelistedMessageTypes(guildId) ?? undefined
      await this.createClient(channel, roomData, { whitelistedMessageTypes })
    }
    this.#multiworlds = multiworlds
  }

  // Starts clients that aren't started, skipping already running clients
  async startAllClients() {
    for (const [channelId, client] of this.#clients) {
      if (client.state === ClientState.Stopped) {
        const multiworld = this.#multiworlds.find(x => x.channelId === channelId)
        if (!multiworld) continue;
        await client.start(multiworld.roomData)
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
      if (normalizedInputUrl === normalizedMultiworldUrl) return true;
    }
    return false
  }

  getChannelIdFromRoomUrl(roomUrl: ArchipelagoRoomUrl) {
    const normalizedInputUrl = normalizeUrl(roomUrl.url, { forceHttps: true })
    for (const multiworld of this.#multiworlds) {
      const normalizedMultiworldUrl = normalizeUrl(multiworld.roomData.roomUrl, { forceHttps: true })
      if (normalizedInputUrl === normalizedMultiworldUrl) return multiworld.channelId
    }
    return null
  }

  async createClient(channel: DC.GuildBasedChannel, roomData: ArchipelagoRoomData, options?: ClientOptions) {
    // const archClient = await makeClient(channel, {
    //   whitelistedMessageTypes: [
    //     ...defaultWhitelistedTypes,
    //     ArchipelagoMessageType.ItemSentUseful,
    //     ArchipelagoMessageType.ItemSentFiller,
    //     ArchipelagoMessageType.ItemSentTrap,
    //   ],
    // })
    const archClient = await makeClient(channel, options)

    this.#clients.set(channel.id, archClient)
    const existingMultiworld = DB.findActiveMultiworld(channel.guildId, channel.id)
    if (existingMultiworld) {
      this.#multiworlds.push(existingMultiworld)
    } else {
      const newMultiworld = await DB.addActiveMultiworld(channel.guildId, channel.id, roomData)
      this.#multiworlds.push(newMultiworld)
    }
  }

  async startClient(channelId: DC.Snowflake) {
    const archClient = this.#clients.get(channelId)
    if (archClient === undefined) throw new Error(`No client found for channel id (${channelId})`);
    const multiworld = this.#multiworlds.find(m => m.channelId === channelId)
    if (multiworld === undefined) throw new Error(`No multiworld found for channel id (${channelId})`);
    await archClient.start(multiworld.roomData)
  }

  async sendMessage(channelId: DC.Snowflake, message: string) {
    const archClient = this.#clients.get(channelId)
    if (archClient === undefined) throw new Error(`No client found for channel id (${channelId})`);
    await archClient.client.messages.say(message)
  }
}

const archClients = new ArchipelagoClientManager()

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN

const intents = [
  DC.GatewayIntentBits.MessageContent,
  DC.GatewayIntentBits.Guilds,
  DC.GatewayIntentBits.GuildMessages,
  DC.GatewayIntentBits.GuildMembers,
]

const discordClient = new DC.Client({ intents })

discordClient.once(DC.Events.ClientReady, async (client) => {
  console.log(`Client ready as "${client.user.tag}"`)
  // TODO: Temp hardcoding for testing
  await DB.setLogChannelId('1399097553567482007', '1399099341691420692')
  await archClients.initFromDb(discordClient)
  await archClients.startAllClients()
})

// Handle forward of messages from a discord channel of an active multiworld
discordClient.on(DC.Events.MessageCreate, async (message) => {
  if (message.author.id === discordClient.user.id) return;
  if (message.author.bot) return;
  if (!archClients.isChannelOfExistingMultiworld(message.channelId)) return;
  // TODO: If multiworld client has STOPPED state, attempt reinit on message and react
  await archClients.sendMessage(message.channelId, `[DISCORD] ${message.author.username} :: ${message.content}`)
})

// Handle the initialization of one active multiworld
discordClient.on(DC.Events.MessageCreate, async (message) => {
  if (message.author.id === discordClient.user.id) return;
  if (message.author.bot) return;
  if (message.channel.isThread()) return;
  const targetChannelId = DB.getLogChannelId(message.guildId)
  if (targetChannelId === null) return;
  const channel = await message.guild.channels.fetch(targetChannelId)
  if (channel === null) return;

  // Checks if message contains archipelago room link
  const archRoomUrl = parseArchipelagoRoomUrl(message.content)
  if (archRoomUrl === null) return;

  // If room already exists, instead reply with link to existing thread
  if (archClients.isRoomUrlOfExistingMultiworld(archRoomUrl)) {
    const existingChannelId = archClients.getChannelIdFromRoomUrl(archRoomUrl)
    if (!existingChannelId) return;
    const existingChannelUrl = (await message.guild?.channels.fetch(existingChannelId))?.url
    if (!existingChannelUrl) return;
    message.reply(existingChannelUrl)
    return;
  }

  const roomData = await getRoomData(archRoomUrl)

  const threadBaseMessage = await (async () => {
    if (message.channelId !== targetChannelId) {
      return await message.forward(targetChannelId)
    }
    return message
  })()
  const newThread = await threadBaseMessage.startThread({
    name: 'Test thread',
    autoArchiveDuration: DC.ThreadAutoArchiveDuration.OneWeek,
  })
  if (newThread.joinable) {
    await newThread.join()
  }
  await newThread.send(createRoomDataDisplay(roomData))

  await archClients.createClient(newThread, roomData)
  await archClients.startClient(newThread.id)
})

discordClient.login(DISCORD_BOT_TOKEN)
