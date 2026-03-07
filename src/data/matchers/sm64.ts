import { IconMatcher } from '../../types/icon-types.js'

export const sm64Icons: IconMatcher[] = [
  { pattern: ['Power Star'], emoji: 'sm64_star' },
  { pattern: [/.*Key/], emoji: 'sm64_key' },
  { pattern: ['Wing Cap'], emoji: 'sm64_wingcap' },
  { pattern: ['Metal Cap'], emoji: 'sm64_metalcap' },
  { pattern: ['Vanish Cap'], emoji: 'sm64_vanishcap' },
  { pattern: ['1Up Mushroom'], emoji: 'sm64_1up' },
  {
    pattern: [
      'Double Jump',
      'Triple Jump',
      'Long Jump',
      'Backflip',
      'Side Flip',
      'Wall Kick',
      'Dive',
      'Ground Pound',
      'Kick',
      'Climb',
      'Ledge Grab',
    ],
    emoji: 'sm64_move'
  },
  { pattern: [/Cannon Unlock.*/], emoji: 'sm64_cannon' },
]
