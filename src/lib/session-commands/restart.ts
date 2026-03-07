import { SessionCommand } from '../../types/session-command.js'

export const restart: SessionCommand = {
  name: 'restart',
  description: 'Attempt to connect to the session',
  async execute (message, _args, session) {
    const loadingReaction = await message.react('⏳')
    await session.start()
    await loadingReaction.remove()
    if (session.isSocketConnected) {
      await message.react('✔️')
    } else {
      await message.react('❌')
    }
  },
}
