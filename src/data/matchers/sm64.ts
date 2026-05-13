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
    emoji: 'sm64_move',
  },
  { pattern: [/Cannon Unlock.*/], emoji: 'sm64_cannon' },
  { pattern: ['Painting Unlock WF'], emoji: 'sm64_paintingwf' },
  { pattern: ['Painting Unlock JRB'], emoji: 'sm64_paintingjrb' },
  { pattern: ['Painting Unlock CCM'], emoji: 'sm64_paintingccm' },
  { pattern: ['Painting Unlock LLL'], emoji: 'sm64_paintinglll' },
  { pattern: ['Painting Unlock WDW'], emoji: 'sm64_paintingwdw' },
  { pattern: ['Painting Unlock TTM'], emoji: 'sm64_paintingttm' },
  { pattern: ['Painting Unlock THI'], emoji: 'sm64_paintingthi' },
  { pattern: ['Painting Unlock TTC'], emoji: 'sm64_paintingttc' },
  {
    pattern: [
      'Painting Unlock SSL',
      'Painting Unlock DDD',
      'Painting Unlock SL',
    ],
    emoji: 'sm64_paintingbowser',
  },
]
