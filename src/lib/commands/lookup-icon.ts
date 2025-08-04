import { Message } from 'discord.js'
import { Command, FlagType } from '../../types/command'
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

async function sendNamedIconListToDiscord(message: Message, gameName: string) {
  const emojiList = IconLookupTable.getFlatNamedEmojiList(gameName)
  const output = Object.entries(emojiList).map(([matcher, emoji]) => `\`${matcher}\`: ${emoji}`).join('\n')
  await sendNewlineSplitDiscordTextMessage(message.reply.bind(message), output)
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
  flags: [{
    type: FlagType.Argless,
    name: 'show-name',
    description: 'If listing all icons of a game, list all names/matchers with its icons.',
  }, {
    type: FlagType.Argful,
    name: 'num-cols',
    argName: '#',
    description: 'If listing all icons, limits number of columns per row. No-op if show-name enabled.',
  }],
  async execute(message, tokens = []) {
    const { flags, splicedTokens } = extractFlags(tokens)

    const showName = flags.findIndex(flag => flag.name === 'show-name') !== -1
    const numCols = (() => {
      const maybeNumCols = Number.parseInt(flags.find(flag => flag.name === 'num-cols')?.arg)
      if (Number.isNaN(maybeNumCols)) return NUM_COLUMNS;
      return maybeNumCols
    })()

    const args = splicedTokens.join(' ')
    const [gameName, itemName] = args.split(' : ')
    const supportedGames = IconLookupTable.getSupportedGames()
    if (gameName === '') {
      await sendNewlineSplitDiscordTextMessage(message.reply.bind(message), (`Supported Games:\n${supportedGames.map(x => `- ${x}`).join('\n')}`))
      return;
    }
    if (!supportedGames.includes(gameName)) {
      await replyWithError(message, `Game (${gameName}) not found.`)
      return;
    }
    if (itemName === undefined) {
      if (showName) {
        await sendNamedIconListToDiscord(message, gameName)
      } else {
        await sendNamelessIconListToDiscord(message, gameName, numCols)
      }
      return;
    }
    const itemIcon = IconLookupTable.lookupItem(gameName, itemName)
    if (itemIcon === null) {
      await replyWithError(message, `Item (${itemName}) not found.`)
      return;
    }
    await message.reply(itemIcon)
  },
}

export default lookupIcon
