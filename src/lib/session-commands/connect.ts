import { search } from 'fast-fuzzy'
import { SessionCommand } from '../../types/session-command.js'
import { SessionLoginAttemptResult } from '../../types/session-types.js'
import { Message } from 'discord.js'

export const connect: SessionCommand = {
  name: 'connect',
  description: 'Attempt to connect to the session',
  async execute (message, args, session) {
    if (args.length <= 0) {
      await session.start()
      if (session.isSocketConnected) {
        await message.react('✔️')
      } else {
        await message.react('❌')
      }
    } else {
      const maybeSlotName = args.join(' ')
      const slotName = await (async () => {
        const playerNames = session.staticState.players.map(p => p.slotName)
        if (!playerNames.includes(maybeSlotName)) {
          const fuzzyResult = search(maybeSlotName, playerNames)
          if (fuzzyResult.length <= 0) {
            return null
          }
          return fuzzyResult[0]
        }
        return maybeSlotName
      })()
      if (!slotName) {
        await message.reply(`Hm, I'm not aware of a session slot with the name ${maybeSlotName}.`)
        return
      }

      const result = await session.start(slotName)

      if (result === SessionLoginAttemptResult.PasswordIncorrect) {
        if (result === SessionLoginAttemptResult.PasswordIncorrect) {
          try {
            const dm = await message.author.send(`It looks like slot "**${slotName}**" requires a password. Please reply with the password within the next 60 seconds.`)

            const filter = (m: Message) => m.author.id === message.author.id
            const collected = await dm.channel.awaitMessages({
              filter,
              max: 1,
              time: 60000,
              errors: ['time'],
            })

            const password = collected.first()?.content
            if (!password) return

            const retryReaction = await message.react('⏳')
            const retryResult = await session.start(slotName, password)
            await retryReaction.remove()

            if (session.isSocketConnected) {
              await message.author.send('Successfully connected with the provided password!')
              await message.react('✔️')
            } else {
              await message.author.send(`Connection failed: ${retryResult}`)
              await message.react('❌')
            }
          } catch (err) {
            await message.author.send('Password entry timed out. Please try the connect command again.')
            await message.react('⏲️')
          }
        }
      } else {
        if (session.isSocketConnected) {
          await message.react('✔️')
        } else {
          await message.react('❌')
        }
      }
    }
  },
}
