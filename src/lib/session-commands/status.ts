import { SessionCommand } from '../../types/session-command.js'
import { getItemTierIcon } from '../icon-lookup-table.js'
import { convertToTimestamp } from '../util/discord-formatting.js'
import { replyWithError, sendNewlineSplitDiscordTextMessage } from '../util/message-utils.js'

export const status: SessionCommand = {
  name: 'status',
  description: 'Get the current status of the session',
  async execute(message, _args, session) {
    const loadingReaction = await message.react('⏳')
    const status = await session.getCurrentStatus()
    await loadingReaction.remove()
    if (!status) {
      await replyWithError(message, `Unable to get current status. Perhaps the server is down?`)
      return;
    }
    const replyTokens = []
    if (session.isSocketConnected) {
      const currentVessel = session.getCurrentVessel()
      if (!currentVessel) {
        await replyWithError(message, `Unable to get status, perhaps try again in a bit?`)
        return;
      }
      replyTokens.push(`${getItemTierIcon('progression')} Connected as ${currentVessel}!`)
    } else {
      replyTokens.push(`${getItemTierIcon('trap')} Disconnected`)
    }
    replyTokens.push(`Last Activity: ${convertToTimestamp(status.lastRoomActivity)}`)
    replyTokens.push('')

    for (const player of session.staticState.players) {
      const alias = status.aliases[player.slotId]
      const nameDisplay = alias ? `**${player.slotName}** "${alias}"` : `**${player.slotName}**`

      const lastActivity = status.lastPlayerActivity[player.slotId]
      const lastConnection = status.lastPlayerConnection[player.slotId]
      const playerStatus = (() => {
        const playerStatus = status.playerStatus[player.slotId] ?? 'Unknown'
        if (playerStatus === 'Playing') {
          return `${getItemTierIcon('progression')} ${playerStatus}`
        } else if (playerStatus === 'Ready' || playerStatus === 'Connected') {
          if (lastActivity) {
            return `${getItemTierIcon('useful')} ${playerStatus} ${convertToTimestamp(lastActivity, 'relative')}`
          }
          return `${getItemTierIcon('useful')} ${playerStatus}`
        } else if (playerStatus === 'Goaled') {
          if (lastActivity) {
            return `🏁 ${convertToTimestamp(lastActivity, 'relative')}`
          }
          return `🏁`
        } else {
          if (lastConnection) {
            return `${getItemTierIcon('filler')} Last connected ${convertToTimestamp(lastConnection, 'relative')}`
          }
          return `${getItemTierIcon('filler')}`
        }
      })()
      replyTokens.push(`- ${nameDisplay} ${playerStatus}`)

      const playerChecksDone = status.checksDone[player.slotId].length ?? 0
      const playerTotalChecks = session.staticState.players.find(p => p.slotId === player.slotId)?.game.totalLocations ?? 1
      const playerItemsReceived = status.itemsReceived[player.slotId].length ?? 0
      const checksPercentage = ((playerChecksDone / playerTotalChecks) * 100).toFixed(2)
      replyTokens.push(`-# Checks: ${playerChecksDone} / ${playerTotalChecks} (${checksPercentage}%)`)
      replyTokens.push(`-# Received: ${playerItemsReceived}`)
    }
    await sendNewlineSplitDiscordTextMessage(message.reply.bind(message), replyTokens.join('\n'))
  },
}