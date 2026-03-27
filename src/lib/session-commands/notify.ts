import { SessionCommand } from '../../types/session-command.js'
import { replyWithError, sendNewlineSplitDiscordTextMessage } from '../util/message-utils.js'

import * as IconLookupTable from '../icon-lookup-table.js'
import { search } from 'fast-fuzzy'
import { ArchipelagoSession } from '../archipelago-session.js'
import { CollectorFilter, Message, MessageReaction, OmitPartialGroupDMChannel, User } from 'discord.js'
import { INotificationRequestsRepository } from '../../db/interfaces.js'

async function sendNotificationRequestList (
  message: OmitPartialGroupDMChannel<Message<boolean>>, session: ArchipelagoSession, notificationRequestsRepo: INotificationRequestsRepository,
) {
  const requests = await notificationRequestsRepo.getNotificationsForUser(session.sessionId, message.author.id)
  if (requests.length <= 0) {
    await message.reply('There are no notification requests from you currently.')
  } else {
    const content = requests.map((request, idx) => {
      const targetPlayer = session.staticState.players.find(p => p.slotId === request.targetPlayerSlotId)
      const slotName = targetPlayer?.slotName ?? 'Unknown player'
      const maybeIcon = IconLookupTable.lookupItem(targetPlayer?.game.name ?? '', request.targetItemName)
      const itemName = maybeIcon ? `${maybeIcon} ${request.targetItemName}` : request.targetItemName
      return `**${idx + 1}**: when __${slotName}__ gets **${itemName}**`
    }).join('\n')
    await sendNewlineSplitDiscordTextMessage(message.reply.bind(message), content)
  }
}

async function handleDeleteAllRequests (
  message: OmitPartialGroupDMChannel<Message<boolean>>,
  session: ArchipelagoSession,
  notificationRequestsRepo: INotificationRequestsRepository,
) {
  const requests = await notificationRequestsRepo.getNotificationsForUser(session.sessionId, message.author.id)
  await Promise.all(requests.map(async request => await notificationRequestsRepo.removeNotification(request.id)))
  await message.react('☑️')
}

async function handleDeleteRequest (
  message: OmitPartialGroupDMChannel<Message<boolean>>,
  session: ArchipelagoSession,
  notificationRequestsRepo: INotificationRequestsRepository,
  maybeIndex?: string,
) {
  const targetIndex = Number.parseInt(maybeIndex ?? '')
  const requests = await notificationRequestsRepo.getNotificationsForUser(session.sessionId, message.author.id)
  if (Number.isNaN(targetIndex) || targetIndex <= 0 || targetIndex > requests.length) {
    if (requests.length <= 0) {
      await message.reply('There already doesn\'t seem to be any notification requests from you.')
    } else {
      await message.reply('The notification number wasn\'t valid...')
    }
  } else {
    const targetRequest = requests.at(targetIndex - 1)!
    await notificationRequestsRepo.removeNotification(targetRequest.id)
    await message.react('☑️')
  }
}

function getClosestSlotName (session: ArchipelagoSession, maybeSlotName: string) {
  const playerNames = session.staticState.players.map(p => p.slotName)
  if (!playerNames.includes(maybeSlotName)) {
    const fuzzyResult = search(maybeSlotName, playerNames)
    if (fuzzyResult.length <= 0) {
      return null
    }
    return fuzzyResult[0]
  }
  return maybeSlotName
}

export const notify: SessionCommand = {
  name: 'notify',
  description: 'Manage notification subscriptions for AP events',
  async execute (message, args, session, { notificationRequestsRepo }) {
    if (args.length <= 0) {
      await message.reply('Possible subcommands: `notify list`, `notify stop <item # | all>`, `notify me when <player> gets <item>`')
      return
    }
    const subcommand = args[0]?.toLowerCase()
    if (subcommand === 'list') {
      await sendNotificationRequestList(message, session, notificationRequestsRepo)
      return
    }
    if (subcommand === 'stop') {
      if (args[1] === 'all') {
        await handleDeleteAllRequests(message, session, notificationRequestsRepo)
      } else {
        await handleDeleteRequest(message, session, notificationRequestsRepo, args[1])
      }
      return
    }
    const totalInput = args.join(' ')
    const match = totalInput.match(/me when (.+?) gets (.+)/i)
    if (!match) {
      await message.reply('Possible subcommands: `notify list`, `notify stop <list number>`, `notify me when <player> gets <item>`')
      return
    }
    const maybeSlotName = match[1]
    const maybeItemName = match[2]
    const slotName = getClosestSlotName(session, maybeSlotName)
    if (!slotName) {
      await message.reply(`Hm, I'm not aware of a session slot with the name ${maybeSlotName}.`)
      return
    }
    const targetPlayer = session.staticState.players.find(p => p.slotName === slotName)!
    const targetGame = targetPlayer.game.name
    const dataPackage = await session.getDataPackage()

    if (!(targetGame in dataPackage.games)) {
      await replyWithError(message, 'Failed to find the player\'s game in the session...')
      return
    }
    const items = Object.keys(dataPackage.games[targetGame].item_name_to_id)
    if (items.includes(maybeItemName)) {
      const existingNotifications = await notificationRequestsRepo.findMatches(session.sessionId, targetPlayer.slotId, maybeItemName)
      if (existingNotifications.length === 0) {
        await notificationRequestsRepo.addNotification({
          sessionId: session.sessionId,
          discordId: message.author.id,
          targetPlayerSlotId: targetPlayer.slotId,
          targetItemName: maybeItemName,
        })
      }
      await message.react('☑️')
    } else {
      const fuzzyResult = search(maybeItemName, items)
      const waitingReply = await message.reply(`I couldn't find the item **${maybeItemName}** for __${targetPlayer.slotName}__. Did you possibly mean **${fuzzyResult[0]}**? If so, react with ⬆️.`)

      try {
        await waitingReply.react('⬆️')
        const collectorFilter: CollectorFilter<[MessageReaction, User]> = (reaction, user) => user.id === message.author.id && reaction.emoji.name === '⬆️'
        await waitingReply.awaitReactions({
          filter: collectorFilter,
          max: 1,
          time: 60000,
          errors: ['time'],
        })
        const existingNotifications = await notificationRequestsRepo.findMatches(session.sessionId, targetPlayer.slotId, fuzzyResult[0])
        if (existingNotifications.length === 0) {
          await notificationRequestsRepo.addNotification({
            sessionId: session.sessionId,
            discordId: message.author.id,
            targetPlayerSlotId: targetPlayer.slotId,
            targetItemName: fuzzyResult[0],
          })
        }
        await waitingReply.react('☑️')
      } catch {
        await waitingReply.reactions.cache.get('⬆️')?.remove()
      }
    }
  },
}
