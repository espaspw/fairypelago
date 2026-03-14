import * as DC from 'discord.js'

import { parseArchipelagoRoomUrl } from './util/archipelago-room-scrape.js'
import { createRoomDataDisplay } from './util/discord-formatting.js'
import { reloadAvaliableCommands, getAvaliableCommands } from './commands.js'
import { catchAndLogError } from './util/general.js'
import { logger } from './util/logger.js'
import { replyWithError, stripDiscordEmojis } from './util/message-utils.js'
import { ArchipelagoSessionRegistry } from './archipelago-session-registry.js'
import { IGuildSettingsRepository, ISessionRepository } from '../db/interfaces.js'
import { sessionCommands } from './session-commands.js'
import { ArchipelagoWebhostClient } from './archipelago-webhost-client.js'
import { IOptionsProvider } from './interfaces/options-provider.js'

const intents = [
  DC.GatewayIntentBits.MessageContent,
  DC.GatewayIntentBits.Guilds,
  DC.GatewayIntentBits.GuildMessages,
  DC.GatewayIntentBits.GuildMembers,
  DC.GatewayIntentBits.DirectMessages,
]

export class DiscordClient {
  #client: DC.Client

  constructor (
    private sessionRegistry: ArchipelagoSessionRegistry,
    private sessionRepo: ISessionRepository,
    private settingsRepo: IGuildSettingsRepository,
    private optionsProvider: IOptionsProvider
  ) {
    this.#client = new DC.Client({ intents })
  }

  async login (token: string) {
    await this.#client.login(token)
  }

  get client () {
    return this.#client
  }

  registerListeners () {
    this.#client.once(DC.Events.ClientReady, async (client) => {
      logger.info('Client ready', { tag: client.user.tag })
      await reloadAvaliableCommands()
      await this.sessionRegistry.initFromDb(this.#client)
      await Promise.all(this.sessionRegistry.getAllSessions().map(async session => {
        if (!session.isSocketConnected) await session.start()
      }))
    })

    // Handle general bot commands
    this.#client.on(
      DC.Events.MessageCreate,
      catchAndLogError(async (message: DC.OmitPartialGroupDMChannel<DC.Message<boolean>>) => {
        if (!this.#client.user) return
        if (message.author.id === this.#client.user.id) return
        if (message.author.bot) return
        if (!message.guildId) return

        const guildSettings = await this.settingsRepo.getSettings(message.guildId)
        if (!message.content.startsWith(guildSettings.commandPrefix)) return

        const truncatedMsg = message.content.substring(guildSettings.commandPrefix.length)
        const tokens = truncatedMsg.split(' ')
        const commandName = tokens.shift()?.toLocaleLowerCase()
        if (!commandName) return

        const avaliableCommands = getAvaliableCommands()

        if (commandName === 'reload' && message.author.id === process.env.OWNER_ID) {
          await reloadAvaliableCommands()
          await message.react('✅')
          await new Promise<void>(resolve => setTimeout(() => resolve(), 2000))
          await message.delete()
        } else if (!(commandName in avaliableCommands)) {
          message.react('❓')
        } else {
          const command = avaliableCommands[commandName as string]
          try {
            await command.execute(message, tokens, avaliableCommands, {
              sessionRegistry: this.sessionRegistry,
              guildSettingsRepo: this.settingsRepo,
              sessionRepo: this.sessionRepo,
              optionsProvider: this.optionsProvider,
            })
            logger.info('Executed command', { commandName, tokens })
          } catch (err) {
            logger.error('Failed to execute command', { err })
            message.react('❗')
          }
        }
      })
    )

    // Handles session commands within a session room, or forward the messages to AP server
    this.#client.on(
      DC.Events.MessageCreate,
      catchAndLogError(async (message: DC.OmitPartialGroupDMChannel<DC.Message<boolean>>) => {
        if (!this.#client.user) return
        if (message.author.id === this.#client.user.id) return
        if (message.author.bot) return

        const existingSession = this.sessionRegistry.getSessionByChannelId(message.channelId)
        if (!existingSession) return

        const guildSettings = await this.settingsRepo.getSettings(message.guildId!)
        const prefix = guildSettings.sessionCommandPrefix

        if (message.content.startsWith(prefix)) {
          const fullContent = message.content.slice(prefix.length).trim()
          const tokens = fullContent.split(/\s+/)
          const commandName = tokens.shift()?.toLowerCase()

          if (commandName && sessionCommands[commandName]) {
            await sessionCommands[commandName].execute(message, tokens, existingSession)
            logger.info('Executed session command', { commandName, tokens, sessionId: existingSession.sessionId })
            return
          }
        }
        // } else if (message.content.toLowerCase().startsWith('find')) {
        //   // const itemNameQuery = message.content.split(' ').splice(1).join(' ')
        //   // const dataPackage = await archClients.fetchPackage(message.channelId)
        //   // if (!dataPackage) {
        //   //   await message.reply(`Could not get the data, perhaps the room needs to be refreshed?`)
        //   //   return;
        //   // }
        //   // const matches: { [key: string]: string[] } = {}
        //   // for (const [game, gamePackage] of Object.entries(dataPackage.games)) {
        //   //   const searcher = new FuzzySearch(Object.keys(gamePackage.item_name_to_id)).search(itemNameQuery) as string[]
        //   //   matches[game] = searcher
        //   // }
        //   // const outputTokens = ['I found these possible matches:']
        //   // for (const [game, results] of Object.entries(matches)) {
        //   //   if (results.length === 0) continue;
        //   //   outputTokens.push(`**${game}**\n-# ${results.map(r => `${r}`).join(', ')}`)
        //   // }
        //   // if (outputTokens.length === 1) {
        //   //   await message.reply('I couldn\'t find any matches...')
        //   // } else {
        //   //   await sendNewlineSplitDiscordTextMessage(message.reply.bind(message), outputTokens.join('\n'))
        //   // }
        // }
        const messageWithShortEmojis = stripDiscordEmojis(message.content)
        try {
          await existingSession.sendMessage(`[${message.author.username}] :: ${messageWithShortEmojis}`)
          logger.info('Forwarded message to archipelago', { message: messageWithShortEmojis })
        } catch (err) {
          logger.info('Failed to forward message', { message: messageWithShortEmojis, err })
        }
      })
    )

    // Handle the initialization of AP session
    this.#client.on(
      DC.Events.MessageCreate,
      catchAndLogError(async (message: DC.OmitPartialGroupDMChannel<DC.Message<boolean>>) => {
        if (!this.#client.user) return
        if (message.author.id === this.#client.user.id) return
        if (message.author.bot) return
        if (message.channel.isThread()) return
        if (!message.guildId) return

        // Checks if message contains archipelago room link
        const archRoomData = parseArchipelagoRoomUrl(message.content)
        if (archRoomData === null) return

        logger.info('AP Room Url detected, attempt to create session', {
          channelId: message.channelId,
          guildId: message.guildId,
          roomData: archRoomData,
        })

        // Check if webhost server endpoint is avaliable. If not, either room link is broken or the server is down.
        const webhostClient = new ArchipelagoWebhostClient(archRoomData.domain)
        const sessionStatus = await webhostClient.fetchSessionStatus(archRoomData.roomId)
        if (!sessionStatus) {
          await replyWithError(message, 'Failed to fetch info from this AP room, perhaps the url is incorrect or the site is down...')
          logger.info('AP room link detected but failed to connect to webhost, ', {
            channelId: message.channelId,
            guildId: message.guildId,
            roomData: archRoomData,
          })
          return
        }

        const guildSettings = await this.settingsRepo.getSettings(message.guildId)

        const logChannelId = guildSettings.logChannelId
        if (logChannelId === null) {
          message.channel.send('Log channel has not been setup yet.')
          logger.info('Did not create session due to missing log channel setting', {
            channelId: message.channelId,
            guildId: message.guildId,
            roomData: archRoomData,
          })
          return
        }
        if (!message.guild) return
        const logChannel = await message.guild.channels.fetch(logChannelId)
        if (logChannel === null) return

        // If room already exists, instead reply with link to existing thread
        const existingSessionChannelId = await this.sessionRegistry.getChannelIdByRoomUrl(archRoomData.url)
        if (existingSessionChannelId) {
          const existingChannelUrl = (await message.guild?.channels.fetch(existingSessionChannelId))?.url
          if (!existingChannelUrl) return
          await message.reply(existingChannelUrl)
          return
        }

        const threadBaseMessage = await (async () => {
          if (message.channelId !== logChannelId) {
            return await message.forward(logChannelId)
          }
          return message
        })()
        const currentDay = new Date().toLocaleDateString()
        const newThreadName = `${sessionStatus.port} with ${Object.keys(sessionStatus.playerStatus).length} worlds on ${currentDay}`
        const newThread = await threadBaseMessage.startThread({
          name: newThreadName,
          autoArchiveDuration: DC.ThreadAutoArchiveDuration.OneWeek,
        })
        if (newThread.joinable) {
          await newThread.join()
        }

        logger.info('New thread created for session', {
          channelId: message.channelId,
          guildId: message.guildId,
          threadId: newThread.id,
          url: archRoomData.url,
        })

        const newSession = await this.sessionRegistry.createSession(newThread, archRoomData)
        if (!newSession) {
          await replyWithError(message, 'Failed to fetch info from this AP room, perhaps the room is expired or the site is down...')
          logger.info('AP roomm link detected but failed to create session, ', {
            channelId: message.channelId,
            guildId: message.guildId,
            threadId: newThread.id,
            url: archRoomData.url
          })
          return
        }

        const initialMessage = await newThread.send(createRoomDataDisplay(newSession.staticState))
        await initialMessage.pin()

        if (message.channelId !== logChannelId) {
          await message.reply(newThread.url)
          logger.info('URL posted outside log channel, forwarded link', {
            channelId: message.channelId,
            guildId: message.guildId,
            threadId: newThread.id,
            url: archRoomData.url
          })
        }

        await newSession.start()
      }))
  }
}
