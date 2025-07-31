interface LookupTable {
  [key: string]: {
    exactMatchers: { [key: string]: string },
    regexMatchers: { r: RegExp, e: string }[],
  }
}

export class IconLookupTable {
  private #gameIcons: GameIcons
  private #lookupTable: LookupTable = {}

  // Creates a index for looking up icons
  // Checks exact matches, falling back to slower regex matches if needed
  private #createLookupTable(itemIcons: ItemIcons) {
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

  populateGameIcons(gameIcons: GameIcons) {
    this.#gameIcons = gameIcons
    return this
  }

  populateItemIcons(itemIcons: ItemIcons) {
    this.#lookupTable = this.#createLookupTable(itemIcons)
    return this
  }

  lookupItem(gameName: string, itemName: string) {
    const gameTable = this.#lookupTable[gameName]
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

  lookupGame(gameName: string) {
    const maybeEmoji = this.#gameIcons[gameName]
    if (maybeEmoji === undefined) return null;
    return maybeEmoji
  }
}
