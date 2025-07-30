import * as DC from 'discord.js'
import * as DB from '../db/db'
import { ArchipelagoClientManager } from './archipelago-client-manager'
import { parseArchipelagoRoomUrl, getRoomData } from './archipelago-room-scrape'
import { createRoomDataDisplay } from './discord-formatting'

const intents = [
  DC.GatewayIntentBits.MessageContent,
  DC.GatewayIntentBits.Guilds,
  DC.GatewayIntentBits.GuildMessages,
  DC.GatewayIntentBits.GuildMembers,
]

export function makeDiscordClient(archClients: ArchipelagoClientManager) {
  const discordClient = new DC.Client({ intents })

  discordClient.once(DC.Events.ClientReady, async (client) => {
    console.log(`Client ready as "${client.user.tag}"`)
    // TODO: Temp hardcoding for testing
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
      return message;
    })();
    const newThread = await threadBaseMessage.startThread({
      name: 'Test thread',
      autoArchiveDuration: DC.ThreadAutoArchiveDuration.OneWeek,
    });
    if (newThread.joinable) {
      await newThread.join()
    }
    await newThread.send(createRoomDataDisplay(roomData))

    await archClients.createClient(newThread, roomData)
    await archClients.startClient(newThread.id)
  })

  return discordClient
}
