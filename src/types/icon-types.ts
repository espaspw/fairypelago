export interface IconMatcher {
  pattern: (string | RegExp)[]
  emoji: string
}

export type DiscordEmojiString = string

export interface LookupTableMatchers {
  exactMatchers: { [key: string]: DiscordEmojiString }
  regexMatchers: { r: RegExp, e: DiscordEmojiString }[]
}

export interface LookupTable {
  [key: string]: LookupTableMatchers
}

export type ItemTier = 'progression' | 'useful' | 'filler' | 'trap'
export type GameIcons = { [key: string]: string }
export type GameIconsText = { [key: string]: DiscordEmojiString }
export type ItemTierIcons = {
  progression?: DiscordEmojiString
  useful?: DiscordEmojiString
  filler?: DiscordEmojiString
  trap?: DiscordEmojiString
}
export type ItemIcons = { [key: string]: IconMatcher[] }
export type ItemIconsText = { [key: string]: DiscordEmojiString }
