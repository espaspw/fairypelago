export interface IconMatcher {
  pattern: (string | RegExp)[]
  emoji: string
}

export type GameIcons = { [key: string]: string }
export type ItemIcons = { [key: string]: IconMatcher[] }
