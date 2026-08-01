import { IconMatcher } from '../../types/icon-types.js'

export const lwnIcons: IconMatcher[] = [
  { pattern: [/\d+\..*/], emoji: 'lwn_lore' },
  {
    pattern: [
      /Abyss.*/,
      /Dark Tunnel.*/,
      'Defeat Enraged Armor Barrier',
      /Lava Ruins.*/,
      /Secret Passage.*/,
      /Shrine.*/,
      /Spirit Realm.*/,
      'Trial Key',
      /Underground.*/,
    ],
    emoji: 'lwn_lock',
  },
  { pattern: ['Arcane'], emoji: 'lwn_arcane' },
  {
    pattern: [
      /Enraged Armor.*/,
      /Specter Armor.*/,
    ],
    emoji: 'lwn_armorboss',
  },
  {
    pattern: [
      /Faint.*/,
      /Meager.*/,
    ],
    emoji: 'lwn_crystalsmall',
  },
  { pattern: [/Fair.*/], emoji: 'lwn_crystalmedium' },
  { pattern: [/Fine.*/], emoji: 'lwn_crystallarge' },
  { pattern: ['Fire'], emoji: 'lwn_fire' },
  { pattern: ['Ice'], emoji: 'lwn_ice' },
  { pattern: ['Mana Absorption'], emoji: 'lwn_absorb' },
  { pattern: [/Monica.*/], emoji: 'lwn_monica' },
  { pattern: ['Progressive Bag Upgrade'], emoji: 'lwn_bag' },
  { pattern: [/Tania.*/], emoji: 'lwn_tania' },
  { pattern: ['Thunder'], emoji: 'lwn_thunder' },
  {
    pattern: [
      'Vanessa Soul',
      'Vanessa Token',
    ],
    emoji: 'lwn_vanessa',
  },
  { pattern: [/Vanessa V2.*/], emoji: 'lwn_vanessav2' },
  { pattern: ['Wind'], emoji: 'lwn_wind' },
  { pattern: ['HP Souls'], emoji: '' },
  { pattern: ['MP Souls'], emoji: '' },
  { pattern: ['Souls'], emoji: '' },
  { pattern: ['Teleport'], emoji: '' },
  { pattern: ['Bonk Trap'], emoji: '' },
  { pattern: ['Mana Drain Trap'], emoji: '' },
]
