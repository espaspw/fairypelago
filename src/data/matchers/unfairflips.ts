import { IconMatcher } from '../../types/icon-types.js'

export const unfairflipsIcons: IconMatcher[] = [
  {
    pattern: [
      'Heads+',
      'Flip+',
      'Combo+',
      'Coin+',
      'AutoFlip+',
    ],
    emoji: 'coin'
  },
  { pattern: ['Progressive Fairness'], emoji: 'thumbsup' },
  { pattern: ['Tails Trap'], emoji: '' },
  { pattern: ['Penny Trap'], emoji: '' },
  { pattern: ['Tax Trap'], emoji: '' },
  { pattern: ['Slow Trap'], emoji: '' },
  {
    pattern: [
      '$',
      '$$',
      '$$$',
    ],
    emoji: 'dollar'
  },
]
