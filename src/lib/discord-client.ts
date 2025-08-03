import * as DC from 'discord.js'
import * as DB from '../db/db'
import { ArchipelagoClientManager, StartClientStatus } from './archipelago-client-manager'
import { parseArchipelagoRoomUrl, getRoomData } from './archipelago-room-scrape'
import { createRoomDataDisplay } from './discord-formatting'
import { reloadAvaliableCommands, getAvaliableCommands } from './commands'

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
    await archClients.initFromDb(discordClient)
    await archClients.startAllClients()
    await reloadAvaliableCommands()
  })

  // Handle general bot commands
  discordClient.on(DC.Events.MessageCreate, async (message) => {
    if (message.author.id === discordClient.user.id) return;
    if (message.author.bot) return;
    const commandPrefix = DB.getCommandPrefix(message.guildId)
    if (message.content.startsWith(commandPrefix)) {
      const truncatedMsg = message.content.substring(commandPrefix.length)
      const tokens = truncatedMsg.split(' ')
      const commandName = tokens.shift()?.toLocaleLowerCase()
      const avaliableCommands = getAvaliableCommands()
      if (commandName === 'reload' && message.author.id === process.env.OWNER_ID) {
        await reloadAvaliableCommands()
        message.react('✅')
      } else if (!(commandName in avaliableCommands)) {
        message.react('❓')
      } else {
        const command = avaliableCommands[commandName]
        try {
          await command.execute(message, tokens, avaliableCommands)
        } catch(err) {
          console.error(err)
          message.react('❗')
        }
      }
    }
  })

  // Handle forward of messages from a discord channel of an active multiworld
  discordClient.on(DC.Events.MessageCreate, async (message) => {
    if (message.author.id === discordClient.user.id) return;
    if (message.author.bot) return;
    if (!archClients.isChannelOfExistingMultiworld(message.channelId)) return;
    if (message.content === 'restart') {
      const startStatus = await archClients.startClient(message.channelId)
      if (startStatus === StartClientStatus.Success) {
        message.react('<:greentick:567088336166977536>')
      } else if (startStatus === StartClientStatus.Failed) {
        message.react('<:redtick:567088349484023818>')
      } else {
        message.react('☑️')
      }
    } else {
      await archClients.sendMessage(message.channelId, `[DISCORD] ${message.author.username} :: ${message.content}`)
    }
  })

  // Handle the initialization of one active multiworld
  discordClient.on(DC.Events.MessageCreate, async (message) => {
    if (message.author.id === discordClient.user.id) return;
    if (message.author.bot) return;
    if (message.channel.isThread()) return;
    const targetChannelId = DB.getLogChannelId(message.guildId)
    if (targetChannelId === null) {
      message.channel.send('Log channel has not been setup yet.')
      return;
    }
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
      name: `archipelago.gg:${roomData.port} : ${new Date().toLocaleString().split(',')[0]}`,
      autoArchiveDuration: DC.ThreadAutoArchiveDuration.OneWeek,
    });
    if (newThread.joinable) {
      await newThread.join()
    }
    await newThread.send(createRoomDataDisplay(roomData))

    await archClients.createClient(newThread, roomData)
    await archClients.startClient(newThread.id)

    if (message.channelId !== targetChannelId) {
      await  message.reply(newThread.url)
    }
  })

  return discordClient
}
