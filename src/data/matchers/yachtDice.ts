import { IconMatcher } from '../../types/icon-types.js'

export const yachtDiceIcons: IconMatcher[] = [
  { pattern: ['Dice'], emoji: 'yd_dice' },
  { pattern: ['Dice Fragment'], emoji: 'yd_dicefragment' },
  { pattern: ['Roll'], emoji: 'yd_roll' },
  { pattern: ['Roll Fragment'], emoji: 'yd_rollfragment' },
  { pattern: [/Category.*/], emoji: 'yd_category' },
  { pattern: [/.*Multiplier/], emoji: 'yd_multiplier' },
  { pattern: ['Encouragement'], emoji: '' },
  { pattern: ['Fun Fact'], emoji: '' },
  { pattern: ['Story Chapter'], emoji: '' },
  { pattern: ['Good RNG'], emoji: '' },
  { pattern: ['Bad RNG'], emoji: '' },
  { pattern: ['Bonus Point'], emoji: '' },
  { pattern: [/[0-9]+ Points?/], emoji: '' },
]
