import { SessionCommand } from '../types/session-command.js'
import { change } from './session-commands/change.js'
import { help } from './session-commands/help.js'
import { hint } from './session-commands/hint.js'
import { connect } from './session-commands/connect.js'
import { status } from './session-commands/status.js'

export const sessionCommands: Record<string, SessionCommand> = {
  status,
  connect,
  help,
  hint,
  change,
}
