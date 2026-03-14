import { IconMatcher } from '../../types/icon-types.js'

export const th6Icons: IconMatcher[] = [
  {
    pattern: [
      '+1 Life',
      '+1 Continue',
    ],
    emoji: 'th6_1up',
  },
  { pattern: ['+1 Bomb'], emoji: 'th6_bomb' },
  { pattern: ['Lower Difficulty'], emoji: 'th6_rumiahappy' },
  {
    pattern: [
      /Reimu.*/,
      /\[Reimu.*/,
    ],
    emoji: 'th6_reimu',
  },
  {
    pattern: [
      /Marisa.*/,
      /\[Marisa.*/,
    ],
    emoji: 'th6_marisa',
  },
  {
    pattern: [
      'Next Stage',
      /.*Remilia/,
    ],
    emoji: 'th6_remilia',
  },
  {
    pattern: [
      'Extra Stage',
      /.*Flandre/,
    ],
    emoji: 'th6_flandre',
  },
  {
    pattern: [
      '+25 Power Point',
      '+1 Power Point',
    ],
    emoji: 'th6_power',
  },
  {
    pattern: [
      'Max Rank',
      '-50% Power Point',
      '-1 Bomb',
      '-1 Life',
      'No Focus',
      'Reverse Movement',
      'Aya Speed',
      'Freeze',
      'Power Point Drain',
    ],
    emoji: 'th6_sakuyasmug',
  },
]
