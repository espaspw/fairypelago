export interface IconMatcher {
  pattern: (string | RegExp)[]
  emoji: string
}

export type ItemTier = 'progression' | 'useful' | 'filler' | 'trap'
export type GameIcons = { [key: string]: string }
export type ItemTierIcons = {
  progression?: string
  useful?: string
  filler?: string
  trap?: string
}
export type ItemIcons = { [key: string]: IconMatcher[] }
