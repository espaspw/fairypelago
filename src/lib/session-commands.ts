import { SessionCommand } from '../types/session-command.js'
import { change } from './session-commands/change.js'
import { help } from './session-commands/help.js'
import { hint } from './session-commands/hint.js'
import { connect } from './session-commands/connect.js'
import { status } from './session-commands/status.js'
import { find } from './session-commands/find.js'
import { ArchipelagoSession } from './archipelago-session.js'
import { Message, OmitPartialGroupDMChannel } from 'discord.js'
import { logger } from './util/logger.js'

export const sessionCommands: Record<string, SessionCommand> = {
  status,
  connect,
  help,
  hint,
  change,
  find,
}

export async function tryToExecuteSessionCommand (
  message: OmitPartialGroupDMChannel<Message<boolean>>,
  content: string,
  session: ArchipelagoSession,
) {
  const tokens = content.split(/\s+/)
  const commandName = tokens.shift()?.toLowerCase()
  if (commandName && sessionCommands[commandName]) {
    const loadingReaction = await message.react('⏳')
    try {
      await sessionCommands[commandName].execute(message, tokens, session)
      logger.info(
        'Executed session command',
        { commandName, tokens, sessionId: session.sessionId },
      )
    } catch (err) {
      logger.error(
        'Failed to execute session command',
        { error: err, commandName, tokens, sessionId: session.sessionId },
      )
    } finally {
      await loadingReaction.remove()
    }
  }
}
