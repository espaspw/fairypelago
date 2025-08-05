import { Message } from 'discord.js'
import { Command } from '../../types/command'
import * as IconLookupTable from '../icon-lookup-table'
import { extractFlags } from '../util/command-utils'
import { replyWithError, sendNewlineSplitDiscordTextMessage } from '../util/message-utils'

const NUM_COLUMNS = 10
const MAX_MSG_LENGTH = 1200

async function sendNamelessIconListToDiscord(message: Message, gameName: string, numCols: number) {
  const gameIcon = IconLookupTable.lookupGame(gameName)
  const emojiList = IconLookupTable.getEmojiList(gameName)
  let runningLength = gameIcon.length + 1
  let messageCounter = 0
  let columnCounter = 0
  const messageTokens = [[gameIcon, '\n']]
  for (const emojiText of emojiList) {
    runningLength += emojiText.length
    if (columnCounter >= numCols) {
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
}

async function sendNamedIconListToDiscord(message: Message, gameName: string, emptyOnly = false) {
  const emojiList = IconLookupTable.getFlatNamedEmojiList(gameName)
  const output = Object.entries(emojiList).map(([matcher, emoji]) => {
    if (emptyOnly && emoji !== '') return null;
    return `\`${matcher}\`: ${emoji}`
  }).filter(x => x !== null)
  if (output.length === 0) await message.reply('No icons found.');
  await sendNewlineSplitDiscordTextMessage(message.reply.bind(message), output.join('\n'))
}

const lookupIconHelpMsg = `**Usage:**
- icon
- icon \`game-name\`
- icon \`game-name\` : \`item-name\`
**Flags:**
- \`--show-name\`: Show each supported item name/matcher with the corresponding icon.`

const lookupIcon: Command = {
  name: 'Lookup Icon',
  aliases: ['icon', 'icons', 'lookupicon', 'lookupicons'],
  categories: ['Utility'],
  description: 'Lookup icons for supported games.',
  usageHelpText: lookupIconHelpMsg,
  flags: {
    showName: {
      name: 'show-name',
      type: Boolean,
      default: false,
      alias: 'n',
      description: 'If listing all icons of a game, list all names/matchers with its icons.',
    },
    numCols: {
      name: 'num-cols',
      type: Number,
      default: NUM_COLUMNS,
      alias: 'c',
      description: 'If listing all icons, limits number of columns per row. No-op if show-name enabled.',
    },
    emptyOnly: {
      name: 'empty-only',
      type: Boolean,
      default: false,
      alias: 'e',
      description: 'If show-name is enabled, only show matchers that do not have a corresponding emoji.',
    }
  },
  async execute(message, tokens = []) {
    const { flags, splicedTokens } = extractFlags(this.flags, tokens)
    console.log(flags)
    const args = splicedTokens.join(' ')
    const [gameName, itemName] = args.split(' : ')
    const supportedGames = IconLookupTable.getSupportedGames()
    if (gameName === '') {
      await sendNewlineSplitDiscordTextMessage(
        message.reply.bind(message),
        (`Supported Games:\n${supportedGames.map(x => `- ${IconLookupTable.lookupGame(x)} ${x}`).join('\n')}`)
      )
      return;
    }
    if (!supportedGames.includes(gameName)) {
      await replyWithError(message, `Game (${gameName}) not found.`)
      return;
    }
    if (itemName === undefined) {
      if (flags.showName) {
        await sendNamedIconListToDiscord(message, gameName, flags.emptyOnly)
      } else {
        await sendNamelessIconListToDiscord(message, gameName, flags.numCols)
      }
      return;
    }
    const itemIcon = IconLookupTable.lookupItem(gameName, itemName)
    if (itemIcon === null) {
      await replyWithError(message, `Item (${itemName}) not found.`)
    } else if (itemIcon === '') {
      await replyWithError(message, `Item (${itemName}) found but empty.`)
    } else {
      await message.reply(itemIcon)
    }
  },
}

export default lookupIcon
