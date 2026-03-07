import { IconMatcher } from '../../types/icon-types.js'
import { smMapRandoIcons } from './smMapRando.js'

export const smz3Icons: IconMatcher[] = [
  ...smMapRandoIcons,
  { pattern: ['ArrowUpgrade5'], emoji: '' },
  { pattern: ['BlueBoomerang'], emoji: '' },
  { pattern: ['Boots'], emoji: '' },
  { pattern: ['Bottle'], emoji: '' },
  { pattern: ['BombUpgrade5'], emoji: '' },
  { pattern: ['Byrna'], emoji: '' },
  { pattern: ['HalfMagic'], emoji: '' },
  { pattern: ['HeartPiece'], emoji: '' },
  { pattern: ['Hookshot'], emoji: '' },
  { pattern: ['Lamp'], emoji: '' },
  { pattern: ['Powder'], emoji: '' },
  { pattern: ['ProgressiveGlove'], emoji: '' },
  { pattern: ['ProgressiveSword'], emoji: '' },
  { pattern: ['ProgressiveTunic'], emoji: '' },
  { pattern: ['Shovel'], emoji: '' },
  { pattern: ['SilverArrows'], emoji: '' },
  { pattern: [/.*Arrows?/], emoji: '' },
  { pattern: [/.*Bombs?/], emoji: '' },
  { pattern: [/$Card.*/], emoji: '' },
  { pattern: [/$Key.*/], emoji: '' },
  { pattern: [/$BigKey.*/], emoji: '' },
  { pattern: [/$Map.*/], emoji: '' },
  { pattern: [/.*Rupees?/], emoji: '' },
]
