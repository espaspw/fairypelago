import { Client } from 'discord.js'
import type { ItemTierIcons, ItemTier, GameIcons, ItemIcons, DiscordEmojiString, LookupTable } from '../types/icon-types'

let gameIconsText: GameIcons = {}
let itemTierIconsText: ItemTierIcons = {}
let lookupTable: LookupTable = {}

let nameToEmojiString: Map<string, DiscordEmojiString> = new Map()

function createLookupTable(itemIcons: ItemIcons) {
  const lookupTable: LookupTable = {}
  for (const [game, matchers] of Object.entries(itemIcons)) {
    const gameTable = {
      exactMatchers: {},
      regexMatchers: [],
    }
    for (const matcher of matchers) {
      const { pattern, emoji: emojiName } = matcher
      for (const strOrRegex of pattern) {
        const emojiString = nameToEmojiString.get(emojiName) ?? ''
        if (typeof strOrRegex === 'string') {
          gameTable.exactMatchers[strOrRegex] = emojiString
        } else {
          gameTable.regexMatchers.push({ r: strOrRegex, e: emojiString })
        }
      }
    }
    lookupTable[game] = gameTable
  }
  return lookupTable
}

export async function fetchApplicationEmojis(discordClient: Client) {
  if (!discordClient.application) throw new Error('Discord client application is missing.');
  const allEmojis = await discordClient.application?.emojis.fetch()
  const reverseMap = new Map<string, string>()
  for (const emoji of allEmojis.values()) {
    reverseMap.set(emoji.name, emoji.toString())
  }
  nameToEmojiString = reverseMap
}

export function populateGameIcons(gameIcons: GameIcons) {
  const output = {}
  for (const [itemName, emojiName] of Object.entries(gameIcons)) {
    const emojiString = nameToEmojiString.get(emojiName) ?? ''
    output[itemName] = emojiString
  }
  gameIconsText = output
}

export function populateItemIcons(itemIcons: ItemIcons) {
  lookupTable = createLookupTable(itemIcons)
}

export function populateItemTierIcons(itemTierIcons: ItemTierIcons) {
  const output = {}
  for (const [itemName, emojiName] of Object.entries(itemTierIcons)) {
    const emojiString = nameToEmojiString.get(emojiName) ?? ''
    output[itemName] = emojiString
  }
  itemTierIconsText = output
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

export function lookupGame(gameName: string): DiscordEmojiString | null {
  const maybeEmoji = gameIconsText[gameName]
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

export function getFlatNamedEmojiList(gameName: string) {
  const matchers = lookupTable[gameName]
  if (matchers === undefined) return {};
  const output: { [key: string]: string } = {}
  const { exactMatchers, regexMatchers } = matchers
  for (const [name, emoji] of Object.entries(exactMatchers)) {
    output[name] = emoji
  }
  for (const { e, r } of regexMatchers) {
    output[r.toString()] = e
  }
  return output
}

export function getItemTierIcon(tier: ItemTier) {
  return itemTierIconsText[tier] ?? null
}
