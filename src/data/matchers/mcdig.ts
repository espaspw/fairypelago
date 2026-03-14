import { IconMatcher } from '../../types/icon-types.js'

export const mcdigIcons: IconMatcher[] = [
  { pattern: ['Progressive Tools'], emoji: 'mc_diamondpickaxe' },
  {
    pattern: [
      'Progressive Haste',
      'Progressive Excavation',
      'Progressive Reach',
      'Progressive Efficiency',
    ],
    emoji: 'mc_haste',
  },
  {
    pattern: [
      'Golden Pick',
      'True Golden Pick',
    ],
    emoji: 'mc_goldpick',
  },
  { pattern: ['TNT'], emoji: 'mc_tnt' },
  {
    pattern: [
      'Defensive Fish',
      'Bee Trap',
      'Creeper Trap',
      'Sand Rain',
      'Spawn Wither',
      'Goon Squad',
      'Fish Fountain',
      'Bad Air',
      'Pocket Sand',
      'Pesky Bird',
      'Flash Flood',
      'Pet the kitty',
      'Wingardium Leviosa',
      'About Face',
      'Acme Delivery',
      'World Barrier Expansion',
      'Meteor Shower',
      'Earthquake',
      'Increased Gravity',
    ],
    emoji: 'mc_badomen',
  },
  { pattern: [/.*Boost/], emoji: 'mc_boost' },
  { pattern: ['Fossil Xray'], emoji: 'mc_glowing' },
  { pattern: ['Explosive Bow'], emoji: 'mc_bow' },
]
