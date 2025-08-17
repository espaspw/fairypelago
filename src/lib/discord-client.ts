import * as DC from 'discord.js'
import FuzzySearch from 'fuzzy-search'
import * as DB from '../db/db'
import { ArchipelagoClientManager, StartClientStatus } from './archipelago-client-manager'
import { parseArchipelagoRoomUrl, getRoomData } from './archipelago-room-scrape'
import { createRoomDataDisplay } from './discord-formatting'
import { reloadAvaliableCommands, getAvaliableCommands } from './commands'
import { catchAndLogError } from './util/general'
import { consoleLogger, fileLogger } from './util/logger'
import { sendNewlineSplitDiscordTextMessage } from './util/message-utils'

const intents = [
  DC.GatewayIntentBits.MessageContent,
  DC.GatewayIntentBits.Guilds,
  DC.GatewayIntentBits.GuildMessages,
  DC.GatewayIntentBits.GuildMembers,
]

export function makeDiscordClient(archClients: ArchipelagoClientManager) {
  const discordClient = new DC.Client({ intents })

  discordClient.once(DC.Events.ClientReady, async (client) => {
    consoleLogger.info(`Client ready as "${client.user.tag}"`)
    fileLogger.info(`Client ready as "${client.user.tag}"`)
    await reloadAvaliableCommands()
    await archClients.initFromDb(discordClient)
    await archClients.startAllClients()
  })

  // Handle general bot commands
  discordClient.on(
    DC.Events.MessageCreate,
    catchAndLogError(async (message: DC.OmitPartialGroupDMChannel<DC.Message<boolean>>) => {
      if (message.author.id === discordClient.user.id) return;
      if (message.author.bot) return;
      const commandPrefix = DB.getCommandPrefix(message.guildId)
      if (!message.content.startsWith(commandPrefix)) return;
      const truncatedMsg = message.content.substring(commandPrefix.length)
      const tokens = truncatedMsg.split(' ')
      const commandName = tokens.shift()?.toLocaleLowerCase()
      const avaliableCommands = getAvaliableCommands()
      if (commandName === 'reload' && message.author.id === process.env.OWNER_ID) {
        await reloadAvaliableCommands()
        await message.react('✅')
        await new Promise(r => setTimeout(() => r(), 2000))
        await message.delete()
      } else if (!(commandName in avaliableCommands)) {
        message.react('❓')
      } else {
        const command = avaliableCommands[commandName]
        try {
          await command.execute(message, tokens, avaliableCommands)
          fileLogger.info(`Executed command (${commandName}) with args (${tokens})`)
        } catch(err) {
          consoleLogger.error(err)
          fileLogger.error(err)
          message.react('❗')
        }
      }
    }
  ))

  // Handle forward of messages from a discord channel of an active multiworld
  discordClient.on(
    DC.Events.MessageCreate, 
    catchAndLogError(async (message: DC.OmitPartialGroupDMChannel<DC.Message<boolean>>) => {
      if (message.author.id === discordClient.user.id) return;
      if (message.author.bot) return;
      if (!archClients.isChannelOfExistingMultiworld(message.channelId)) return;
      if (message.content === 'restart') {
        const startStatus = await archClients.startClient(message.channelId)
        if (startStatus === StartClientStatus.Success) {
          message.react('✔️')
        } else if (startStatus === StartClientStatus.Failed) {
          message.react('❌')
        } else {
          message.react('☑️')
        }
      } else if(message.content.toLowerCase().startsWith('find')) {
        const itemNameQuery = message.content.split(' ').splice(1).join(' ')
        const dataPackage = await archClients.fetchPackage(message.channelId)
        if (!dataPackage) {
          await message.reply(`Could not get the data, perhaps the room needs to be refreshed?`)
          return;
        }
        const matches: { [key: string]: string[] } = {}
        for (const [game, gamePackage] of Object.entries(dataPackage.games)) {
          const searcher = new FuzzySearch(Object.keys(gamePackage.item_name_to_id)).search(itemNameQuery) as string[]
          matches[game] = searcher
        }
        const outputTokens = ['I found these possible matches:']
        for (const [game, results] of Object.entries(matches)) {
          if (results.length === 0) continue;
          outputTokens.push(`**${game}**\n-# ${results.map(r => `${r}`).join(', ')}`)
        }
        if (outputTokens.length === 1) {
          await message.reply('I couldn\'t find any matches...')
        } else {
          await sendNewlineSplitDiscordTextMessage(message.reply.bind(message), outputTokens.join('\n'))
        }
      } else {
        await archClients.sendMessage(message.channelId, `[DISCORD] ${message.author.username} :: ${message.content}`)
        fileLogger.info(`Forwarded message "${message.content}" to archipelago.`)
      }
    }
  ))

  // Handle the initialization of one active multiworld
  discordClient.on(
    DC.Events.MessageCreate,
    catchAndLogError(async (message: DC.OmitPartialGroupDMChannel<DC.Message<boolean>>) => {
      if (message.author.id === discordClient.user.id) return;
      if (message.author.bot) return;
      if (message.channel.isThread()) return;

      // Checks if message contains archipelago room link
      const archRoomUrl = parseArchipelagoRoomUrl(message.content)
      if (archRoomUrl === null) return;

      const targetChannelId = DB.getLogChannelId(message.guildId)
      if (targetChannelId === null) {
        message.channel.send('Log channel has not been setup yet.')
        return;
      }
      const targetChannel = await message.guild.channels.fetch(targetChannelId)
      if (targetChannel === null) return;

      // If room already exists, instead reply with link to existing thread
      if (archClients.isRoomUrlOfExistingMultiworld(archRoomUrl)) {
        const existingChannelId = archClients.getChannelIdFromRoomUrl(archRoomUrl)
        if (!existingChannelId) return;
        const existingChannelUrl = (await message.guild?.channels.fetch(existingChannelId))?.url
        if (!existingChannelUrl) return;
        await message.reply(existingChannelUrl)
        fileLogger.info(`URL (${archRoomUrl.url}) detected but room already existed.`)
        return;
      }

      const roomData = await getRoomData(archRoomUrl)

      const threadBaseMessage = await (async () => {
        if (message.channelId !== targetChannelId) {
          return await message.forward(targetChannelId)
        }
        return message;
      })();
      const newThreadName = `${roomData.port} : ${roomData.players.length}P : ${new Date().toLocaleString().split(',')[0]}`
      const newThread = await threadBaseMessage.startThread({
        name: newThreadName,
        autoArchiveDuration: DC.ThreadAutoArchiveDuration.OneWeek,
      });
      if (newThread.joinable) {
        await newThread.join()
      }

      fileLogger.info(`New thread (${newThread.channelId}) created for URL (${archRoomUrl.url})`)

      await archClients.createClient(newThread, roomData)
      await archClients.startClient(newThread.id)
      const itemCounts = archClients.getItemCounts(newThread.id)

      await newThread.send(createRoomDataDisplay(roomData, itemCounts))

      if (message.channelId !== targetChannelId) {
        await message.reply(newThread.url)
        fileLogger.info(`URL (${archRoomUrl.url}) posted outside log channel, forwarding link.`)
      }
    }
  ))

  return discordClient
}
