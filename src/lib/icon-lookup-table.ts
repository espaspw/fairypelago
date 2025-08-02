import { type GameIcons } from '../types/icon-types'

interface LookupTable {
  [key: string]: {
    exactMatchers: { [key: string]: string },
    regexMatchers: { r: RegExp, e: string }[],
  }
}

let gameIcons: GameIcons = {}
let lookupTable: LookupTable = {}

function createLookupTable(itemIcons: ItemIcons) {
    const lookupTable: LookupTable = {}
    for (const [game, matchers] of Object.entries(itemIcons)) {
      const gameTable = {
        exactMatchers: {},
        regexMatchers: [],
      }
      for (const matcher of matchers) {
        const { pattern, emoji } = matcher
        for (const strOrRegex of pattern) {
          if (typeof strOrRegex === 'string') {
            gameTable.exactMatchers[strOrRegex] = emoji
          } else {
            gameTable.regexMatchers.push({ r: strOrRegex, e: emoji })
          }
        }
      }
      lookupTable[game] = gameTable
    }
    return lookupTable
  }

export function populateGameIcons(_gameIcons: GameIcons) {
  gameIcons = _gameIcons
  return this
}

export function populateItemIcons(itemIcons: ItemIcons) {
  lookupTable = createLookupTable(itemIcons)
  return this
}

export function lookupItem(gameName: string, itemName: string) {
  const gameTable = lookupTable[gameName]
  if (gameTable === undefined) return null;
  const maybeEmoji = gameTable.exactMatchers[itemName]
  if (maybeEmoji !== undefined) return maybeEmoji;
  for (const regexp of gameTable.regexMatchers) {
    if (regexp.r.test(itemName)) {
      return regexp.e
    }
  }
  return null
}

export function lookupGame(gameName: string) {
  const maybeEmoji = gameIcons[gameName]
  if (maybeEmoji === undefined) return null;
  return maybeEmoji
}

export function getSupportedGames() {
  return Object.keys(lookupTable)
}

export function getEmojiList(gameName: string) {
  const matchers = lookupTable[gameName]
  if (matchers === undefined) return [];
  const output = new Set<string>()
  const { exactMatchers, regexMatchers } = matchers
  for (const emoji of Object.values(exactMatchers)) {
    output.add(emoji)
  }
  for (const { e } of regexMatchers) {
    output.add(e)
  }
  return [...output]
}
