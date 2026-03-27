import { Player, Item } from 'archipelago.js'
import * as DC from 'discord.js'

import { IEventHandler } from './interfaces/event-handler.js'
import { EventToDiscordFormatter } from './event-to-discord-formatter.js'
import { INotificationRequestsRepository, ISessionRepository } from '../db/interfaces.js'
import { ArchipelagoSession } from './archipelago-session.js'
import { getItemTierIcon } from './icon-lookup-table.js'
import { CoalescingChannelWrapper } from './util/coalescing-channel-wrapper.js'
import { SessionLoginAttemptResult } from '../types/session-types.js'

export interface ArchipelagoEventHandlerDeps {
  formatter: EventToDiscordFormatter;
  discordChannel: DC.TextChannel | DC.ThreadChannel;
  sessionRepo: ISessionRepository;
  notificationRequestsRepo: INotificationRequestsRepository;
}

function itemFlagToIcon (flags: number): string {
  if (flags & 0b001) return getItemTierIcon('progression') ?? 'unknown'
  if (flags & 0b010) return getItemTierIcon('useful') ?? 'unknown'
  if (flags & 0b100) return getItemTierIcon('trap') ?? 'unknown'
  return getItemTierIcon('filler') ?? 'unknown'
}

export class EventToDiscordHandler implements IEventHandler {
  #sessionId: number
  #formatter: EventToDiscordFormatter
  #discordChannel: CoalescingChannelWrapper<string>
  #sessionRepo: ISessionRepository
  #notificationRequestsRepo: INotificationRequestsRepository

  constructor (sessionId: number, deps: ArchipelagoEventHandlerDeps) {
    this.#sessionId = sessionId
    this.#formatter = deps.formatter
    this.#discordChannel = new CoalescingChannelWrapper(deps.discordChannel, 1500)
    this.#sessionRepo = deps.sessionRepo
    this.#notificationRequestsRepo = deps.notificationRequestsRepo
  }

  async sessionIdle (session: ArchipelagoSession) {
    await this.#discordChannel.send('I\'m ready to go. Give me the \'connect\' command to connect to the session to begin logging.')
  }

  async sessionFailedAutojoin (session: ArchipelagoSession, attemptResult: SessionLoginAttemptResult) {
    const lastMessage = await (await this.#discordChannel.channel.messages.fetch({ limit: 1 })).first()
    if (lastMessage?.author.id === this.#discordChannel.channel.client.user.id) return
    if (attemptResult === SessionLoginAttemptResult.PasswordIncorrect) {
      await this.#discordChannel.send('It looks like every player has a password. You\'ll have to give me an explicit `connect` command with a slot name.')
    } else if (attemptResult === SessionLoginAttemptResult.ServerDown) {
      await this.#discordChannel.send('It looks like the server might be down. Give me the `connect` command when you want me to try rejoining.')
    } else if (attemptResult === SessionLoginAttemptResult.Unknown) {
      await this.#discordChannel.send('I failed to join the session. You\'ll have to give me the `connect` command to try joining.')
    }
  }

  async socketDisconnected (session: ArchipelagoSession, isFinished: boolean) {
    if (isFinished) {
      await this.#discordChannel.send('I\'ve disconnected as the session appears to be finished.')
    } else {
      await this.#discordChannel.send('I\'ve disconnected. Give me the `connect` command to try reconnecting.')
    }
  }

  async socketConnected (session: ArchipelagoSession) {
    const currentVessel = session.getCurrentVessel()
    await this.#discordChannel.send(`I've connected to the session through __${currentVessel}__.`)
  }

  async botShutdown (session: ArchipelagoSession) {
    await this.#discordChannel.send('I\'m heading out for the day.')
  }

  async adminCommand (session: ArchipelagoSession, text: string) {
    await this.#discordChannel.send(await this.#formatter.adminCommand(text))
  }

  async chat (session: ArchipelagoSession, message: string, player: Player) {
    const responseMsg = await this.#formatter.chat(message, player)
    if (responseMsg === null) return
    await this.#discordChannel.send(responseMsg)

    // Special hint printing behavior if the message is a hint command
    if (message.startsWith('!hint')) {
      const hints = await session.getPlayerHints(player.name)
      if (!hints) {
        await this.#discordChannel.send('I couldn\'t seem to get the hints...')
        return
      }
      const reply = hints.map(hint => (
        `- ${itemFlagToIcon(hint.item.flags)} **${this.#formatter.formatItem(hint.item)}** at **${hint.item.locationName}** in __${hint.item.sender.alias}__'s world`
      )).join('\n')
      await this.#discordChannel.send(reply)
    }
  }

  async collected (session: ArchipelagoSession, text: string, player: Player) {
    await this.#discordChannel.send(await this.#formatter.collected(text, player))
  }

  async connected (session: ArchipelagoSession, text: string, player: Player, tags: string[]) {
    const responseMsg = await this.#formatter.connected(text, player, tags)
    if (responseMsg === null) return
    await this.#discordChannel.send(responseMsg)
  }

  async countdown (session: ArchipelagoSession, text: string, value: number) {
    await this.#discordChannel.send(`${value}!`)
  }

  async disconnected (session: ArchipelagoSession, text: string, player: Player) {
    await this.#discordChannel.send(await this.#formatter.disconnected(text, player))
  }

  async goaled (session: ArchipelagoSession, text: string, player: Player) {
    await this.#discordChannel.send(await this.#formatter.goaled(text, player))
  }

  async allGoaled (session: ArchipelagoSession) {
    await this.#sessionRepo.setSessionExpired(this.#sessionId)
    await this.#discordChannel.send('All players have finished!')
  }

  async itemCheated (session: ArchipelagoSession, text: string, item: Item) {
    await this.#discordChannel.send(await this.#formatter.itemCheated(text, item))
  }

  async itemHinted (session: ArchipelagoSession, text: string, item: Item) {
    await this.#discordChannel.send(await this.#formatter.itemHinted(text, item))
  }

  async itemSent (session: ArchipelagoSession, text: string, item: Item) {
    const formattedMsg = await this.#formatter.itemSent(text, item)
    const numPlayers = session.staticState.players.length
    const messageTag = numPlayers > 8 ? 'item' : `item:${item.sender.name}`
    await this.#discordChannel.send(formattedMsg, messageTag)
    const notificationRequests = await this.#notificationRequestsRepo.findMatches(session.sessionId, item.receiver.slot, item.name)
    if (notificationRequests.length > 0) {
      await this.#discordChannel.send(notificationRequests.map(r => `<@${r.discordId}> `).join(' '))
    }
  }

  async released (session: ArchipelagoSession, text: string, player: Player) {
    await this.#discordChannel.send(await this.#formatter.released(text, player))
  }

  async serverChat (session: ArchipelagoSession, message: string) {
    await this.#discordChannel.send(await this.#formatter.serverChat(message))
  }

  async tagsUpdated (session: ArchipelagoSession, text: string, player: Player, tags: string[]) { }

  async tutorial (session: ArchipelagoSession, text: string) { }

  async userCommand (session: ArchipelagoSession, text: string) {
    await this.#discordChannel.send(await this.#formatter.userCommand(text))
  }
}
