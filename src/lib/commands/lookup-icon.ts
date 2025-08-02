import { Command } from '../../types/command'
import * as IconLookupTable from '../icon-lookup-table'

const NUM_COLUMNS = 10
const MAX_MSG_LENGTH = 1200

const lookupIcon: Command = {
  name: 'Lookup Icon',
  aliases: ['icon', 'lookupicon'],
  categories: ['Utility'],
  description: 'Lookup icons for supported games.',
  helpMessage: '- icon\n- icon `game-name`\n- icon `game-name` : `item-name`',
  async execute(message, tokens = []) {
    const args = tokens.join(' ')
    const [gameName, itemName] = args.split(' : ')
    console.log(gameName)
    const supportedGames = IconLookupTable.getSupportedGames()
    if (gameName === '') {
      await message.reply(`Supported Games:\n${supportedGames.map(x => `- ${x}`).join('\n')}`)
      return;
    }
    if (!supportedGames.includes(gameName)) {
      await message.reply(`Game (${gameName}) not found.`)
      return;
    }
    if (itemName === undefined) {
      const gameIcon = IconLookupTable.lookupGame(gameName)
      const emojiList = IconLookupTable.getEmojiList(gameName)
      let runningLength = gameIcon.length + 1
      let messageCounter = 0
      let columnCounter = 0
      const messageTokens = [[gameIcon, '\n']]
      for (const emojiText of emojiList) {
        runningLength += emojiText.length
        if (columnCounter > NUM_COLUMNS) {
          messageTokens[messageCounter].push('\n')
          columnCounter = 0
        }
        if (runningLength > MAX_MSG_LENGTH) {
          runningLength -= MAX_MSG_LENGTH
          messageCounter += 1
          columnCounter = 0
          messageTokens.push([emojiText])
        } else {
          messageTokens[messageCounter].push(emojiText)
        }
        columnCounter += 1
      }
      for (const tokens of messageTokens) {
        const outputPart = tokens.join('')
        await message.reply(outputPart)
      }
      return;
    }
    const itemIcon = IconLookupTable.lookupItem(gameName, itemName)
    if (itemIcon === null) {
      await message.reply(`Item (${itemName}) not found.`)
      return;
    }
    await message.reply(itemIcon)
  },
}

export default lookupIcon
