import 'dotenv/config'

import * as DC from 'discord.js'
import { Client as ArchClient } from 'archipelago.js'

import {
  parseArchipelagoRoomUrl,
  getRoomData,
  type ArchipelagoRoomData,
  type ArchipelagoRoomPlayerData
} from './lib/scrape'
import * as DB from './db/db'
import { defaultWhitelistedTypes, makeClient, ArchipelagoMessageTypes } from './archipelago-client'

function createRoomDataDisplay(roomData: ArchipelagoRoomData) {
  const tokens = ['### Player Worlds']
  tokens.push(...roomData.players.map(createUserDataDisplay))
  return tokens.join('\n')
}

function createUserDataDisplay(playerData: ArchipelagoRoomPlayerData) {
  const tokens = [
    `- **${playerData.name}** : ${playerData.game}`,
    `-# ([Tracker](<${playerData.trackerPage}>)${playerData.downloadLink ? ` | [Patch](<${playerData.downloadLink}>)` : ''})`
  ]
  return tokens.join('\n')
}

class ArchipelagoClientManager {
  private clients = new Map<DC.Snowflake, ArchClient>
  private roomDatas = new Map<DC.Snowflake, ArchipelagoRoomData>

  async initFromDb(discordClient: DC.Client) {
    const allRoomData = await DB.getAllRoomData()
    for (const [channelId, roomData] of allRoomData) {
      await discordClient.guilds.
      await this.createClient(newThread, roomData)
    }
  }

  async createClient(channel: DC.Channel, roomData: ArchipelagoRoomData) {
    const archClient = await makeClient(channel, {
      whitelistedMessageTypes: [
        ...defaultWhitelistedTypes,
        ArchipelagoMessageTypes.ItemSentUseful,
        ArchipelagoMessageTypes.ItemSentFiller,
        ArchipelagoMessageTypes.ItemSentTrap,
      ],
    })

    this.clients.set(channel.id, archClient)
    this.roomDatas.set(channel.id, roomData)
    await DB.addActiveRoom(channel.id, roomData)
  }

  async startClient(channelId: DC.Snowflake) {
    const archClient = this.clients.get(channelId)
    const roomData = this.roomDatas.get(channelId)
    await archClient.login(
      `archipelago.gg:${roomData.port}`,
      roomData.players[0].name,
      null,
      { tags: ['Discord'] },
    )
  }

  async sendMessage(channelId: DC.Snowflake, message: string) {
    const archClient = this.clients.get(channelId)
    await archClient?.messages.say(message)
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
})

discordClient.on(DC.Events.MessageCreate, async (message) => {
  if (message.author.id === discordClient.user.id) return;
  if (message.author.bot) return;
  if (!DB.isChannelOfActiveRoom(message.channelId)) return;

  await archClients.sendMessage(message.channelId, `${message.author.username} :: ${message.content}`)
})

discordClient.on(DC.Events.MessageCreate, async (message) => {
  if (message.author.id === discordClient.user.id) return;
  if (message.author.bot) return;
  if (message.channel.isThread()) return;
  const targetChannelId = DB.getLogChannelId(message.guildId)
  const channel = await message.guild.channels.fetch(targetChannelId)
  if (channel === null) return;
  // TODO: This check can be moved to initializing channel cache
  if (!(channel instanceof DC.TextChannel)) return;

  const archRoomUrl = parseArchipelagoRoomUrl(message.content)
  if (archRoomUrl === null) return;
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
  const roomDataInitialMessage = await newThread.send({
    content: createRoomDataDisplay(roomData),
  })

  await archClients.createClient(newThread, roomData)
  await archClients.startClient(newThread.id)
})

discordClient.login(DISCORD_BOT_TOKEN)
