import { IconMatcher } from '../../types/icon-types.js'

export const adokuIcons: IconMatcher[] = [
  { pattern: ['Solve Random Cell'], emoji: 'white_check_mark' },
  { pattern: [/Solve.*/], emoji: 'white_check_mark' },
  { pattern: ['Remove Random Candidate'], emoji: 'bulb' },
  { pattern: ['Nothing'], emoji: '' },
  { pattern: ['Progressive Block'], emoji: 'memo' },
  { pattern: ['Emoji Trap'], emoji: 'sweat_smile' },
  { pattern: ['Disco Trap'], emoji: 'mirror_ball' },
  { pattern: ['Tunnel Vision Trap'], emoji: 'eye' },
  { pattern: [/Block.*/], emoji: 'notebook' },
]