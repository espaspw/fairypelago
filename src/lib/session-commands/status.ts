import { SessionCommand } from '../../types/session-command.js'
import { getItemTierIcon } from '../icon-lookup-table.js'
import { convertToTimestamp } from '../util/discord-formatting.js'
import { replyWithError } from '../util/message-utils.js'
import { ArchipelagoSession } from '../archipelago-session.js'
import { SessionStatus } from '../../types/session-types.js'

interface PlayerProgress {
  checksDone: number
  totalChecks: number
  itemsReceived: number
}

interface SessionProgress {
  totalCompletedChecks: number
  totalChecks: number
  completedGames: number
  playerProgress: Record<number, PlayerProgress>
}

// If there are more than this many players, only show short-form status
const longFormPlayerLimit = 8

function formatProgressBar (percentage: number, segments = 20) {
  const totalFilled = Math.floor((percentage / 100) * segments)
  const filledChar = '█'
  const partialChar = '▓'
  const emptyChar = '░'
  if (totalFilled >= segments) {
    return filledChar.repeat(segments)
  }
  const filledPart = filledChar.repeat(totalFilled)
  const emptyPart = emptyChar.repeat(segments - totalFilled - 1)
  return `${filledPart}${partialChar}${emptyPart}`
}

function formatStaticState (session: ArchipelagoSession) {
  const connectionStatus = session.isSocketConnected
    ? `${getItemTierIcon('progression')} Connected as ${session.getCurrentVessel() ?? 'Unknown'}!`
    : `${getItemTierIcon('trap')} Disconnected`
  const totalChecks = `Total checks: ${session.staticState.players.reduce((acc, p) => acc + p.game.totalLocations, 0)}`
  const numPlayers = `Number of players: ${session.staticState.players.length}`

  if (session.staticState.players.length > longFormPlayerLimit) return [connectionStatus, '', totalChecks, numPlayers].join('\n')

  const playerData = session.staticState.players.map(p => {
    return [
      `- **${p.slotName}** ${getItemTierIcon('filler')}`,
      `-# Playing: ${p.game.name}`,
      `-# Checks: ${p.game.totalLocations}`,
    ].join('\n')
  }).join('\n')
  return [connectionStatus, '', totalChecks, numPlayers, '', playerData].join('\n')
}

function getProgress (session: ArchipelagoSession, status: SessionStatus): SessionProgress {
  let totalCompletedChecks = 0
  let totalChecks = 0
  let completedGames = 0
  const playerProgress: Record<number, PlayerProgress> = {}
  for (const player of session.staticState.players) {
    const playerChecksDone = status.checksDone[player.slotId].length ?? 0
    const playerTotalChecks = session.staticState.players.find(p => p.slotId === player.slotId)?.game.totalLocations ?? 1
    const playerItemsReceived = status.itemsReceived[player.slotId].length ?? 0
    if (status.playerStatus[player.slotId] === 'Goaled') completedGames += 1
    playerProgress[player.slotId] = {
      checksDone: playerChecksDone,
      totalChecks: playerTotalChecks,
      itemsReceived: playerItemsReceived,
    }
    totalCompletedChecks += playerChecksDone
    totalChecks += playerTotalChecks
  }
  return {
    totalCompletedChecks,
    totalChecks,
    completedGames,
    playerProgress,
  }
}

function formatDynamicState (session: ArchipelagoSession, status: SessionStatus) {
  const progress = getProgress(session, status)
  const totalChecksPercent = progress.totalChecks > 0 ? (progress.totalCompletedChecks / progress.totalChecks) * 100 : 100
  const playersConnected = Object.values(status.playerStatus).filter(s => s !== 'Goaled' && s !== 'Unknown').length

  const replyTokens = []
  if (session.isSocketConnected) {
    const currentVessel = session.getCurrentVessel() ?? 'Unknown'
    replyTokens.push(`${getItemTierIcon('progression')} Connected as __${currentVessel}__!`)
  } else {
    replyTokens.push(`${getItemTierIcon('trap')} Disconnected`)
  }
  replyTokens.push('')
  replyTokens.push(formatProgressBar(totalChecksPercent))
  replyTokens.push(`**${totalChecksPercent.toFixed(2)}% (${progress.totalCompletedChecks} / ${progress.totalChecks})**`)
  replyTokens.push(`Games completed: **${progress.completedGames} / ${session.staticState.players.length}**`)
  replyTokens.push(`Players connected: **${playersConnected} / ${session.staticState.players.length}**`)
  replyTokens.push(`Last Activity: ${convertToTimestamp(status.lastRoomActivity)}`)
  replyTokens.push('')

  if (session.staticState.players.length > longFormPlayerLimit) return replyTokens.join('\n')

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
          return ` 🏁 ${convertToTimestamp(lastActivity, 'relative')}`
        }
        return ' 🏁'
      } else {
        if (lastConnection) {
          return `${getItemTierIcon('filler')} Last connected ${convertToTimestamp(lastConnection, 'relative')}`
        }
        return `${getItemTierIcon('filler')}`
      }
    })()
    replyTokens.push(`- ${nameDisplay} ${playerStatus}`)
    replyTokens.push(`-# Playing: ${player.game.name}`)

    const playerProgress = progress.playerProgress[player.slotId]
    const checksPercentage = ((playerProgress.checksDone / playerProgress.totalChecks) * 100).toFixed(2)
    replyTokens.push(`-# Checks: ${playerProgress.checksDone} / ${playerProgress.totalChecks} (${checksPercentage}%)`)
    replyTokens.push(`-# Received: ${playerProgress.itemsReceived}`)
  }
  return replyTokens.join('\n')
}

export const status: SessionCommand = {
  name: 'status',
  description: 'Get the current status of the session',
  async execute (message, _args, session) {
    const initialReply = await message.reply(formatStaticState(session))
    const currentStatus = await session.getCurrentStatus()
    if (!currentStatus) {
      await replyWithError(message, 'Unable to get current status. Perhaps the server is down?')
      return
    }

    await initialReply.edit(formatDynamicState(session, currentStatus).substring(0, 2000))
  },
}
