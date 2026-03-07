import { IconMatcher } from '../../types/icon-types.js'

export const ror2Icons: IconMatcher[] = [
  { pattern: ['Common Item'], emoji: 'ror2_commonitem' },
  { pattern: ['Uncommon Item'], emoji: 'ror2_uncommonitem' },
  { pattern: ['Legendary Item'], emoji: 'ror2_legendaryitem' },
  { pattern: ['Boss Item'], emoji: 'ror2_bossitem' },
  { pattern: ['Equipment'], emoji: 'ror2_equipment' },
  { pattern: [/Item Scrap, .*/], emoji: 'ror2_itemscrap' },
  { pattern: ['Void Item'], emoji: 'ror2_voiditem' },
  { pattern: ['Lunar Item'], emoji: 'ror2_lunaritem' },
  { pattern: ["Dio's Best Friend"], emoji: 'ror2_diosbestfriend' },
  { pattern: ['Beads of Fealty'], emoji: 'ror2_beadsoffealty' },
  { pattern: ['Radar Scanner'], emoji: 'ror2_radarscanner' },
  { pattern: ['Lunar Coin'], emoji: 'ror2_lunarcoin' },
  { pattern: [/Stage [0-9]+/, 'Progressive Stage'], emoji: 'ror2_area' },
  { pattern: ['Mountain Trap'], emoji: '' },
  { pattern: ['Time Warp Trap'], emoji: '' },
  { pattern: ['Combat Trap'], emoji: '' },
  { pattern: ['Teleport Trap'], emoji: '' },
]
