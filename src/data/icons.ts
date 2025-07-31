import { IconMatcher, GameIcons, ItemIcons } from '../types/icon-types'

const ahitItemIcons: IconMatcher[] = [
  { pattern: ['Yarn'], emoji: '<:ahit_yarn:1400022862542143550>' },
  { pattern: ['Time Piece'], emoji: '<:ahit_timepiece:1400022788034527285>' },
  { pattern: ['Sprint Hat'], emoji: '<:ahit_sprinthat:1400022669071613972>' },
  { pattern: ['Brewing Hat'], emoji: '<:ahit_brewinghat:1400022641984671834>' },
  { pattern: ['Ice Hat'], emoji: '<:ahit_icehat:1400022660041408542>' },
  { pattern: ['Dweller Mask'], emoji: '<:ahit_dwellerhat:1400022652000665692>' },
  { pattern: ['Time Stop Hat'], emoji: '<:ahit_timestophat:1400022678156349541>' },
  { pattern: ['Projectile Badge'], emoji: '<:ahit_projectilebadge:1400022812810547200>' },
  { pattern: ['Fast Hatter Badge'], emoji: '<:ahit_fasthatterbadge:1400022606400454729>' },
  { pattern: ['Hover Badge'], emoji: '<:ahit_hoverbadge:1400022688638173326>' },
  { pattern: ['Hookshot Badge'], emoji: '<:ahit_hookshotbadge:1400187966307045447>' },
  { pattern: ['Item Magnet Badge'], emoji: '<:ahit_itemmagnetbadge:1400022706430279861>' },
  { pattern: ['No Bonk Badge'], emoji: '<:ahit_nobonkbadge:1400022802576179260>' },
  { pattern: ['Compass Badge'], emoji: '<:ahit_compassbadge:1400022543968108644>' },
  { pattern: ['Scooter Badge'], emoji: '<:ahit_scooterbadge:1400022831412285450>' },
  { pattern: ['One-Hit Hero Badge'], emoji: '<:ahit_onehitherobadge:1400187974473355455>' },
  { pattern: ['Camera Badge'], emoji: '<:ahit_camerabadge:1400187959205957722>' },
  { pattern: [/Relic.*/], emoji: '<:ahit_relic:1400022822067376158>' },
  { pattern: [/[0-9]+ Pons/], emoji: '<:ahit_pon:1400022758208831569>' },
  { pattern: ['Health Pon'], emoji: '<:ahit_healthpon:1400022766345912381>' },
  { pattern: ['Random Cosmetic'], emoji: '<:ahit_cosmetic:1400022778551468143>' },
  { pattern: ['Umbrella'], emoji: '<:ahit_umbrella:1400022851658186864>' },
  { pattern: ['Metro Ticket - Yellow'], emoji: '<:ahit_metroticketyellow:1400022749002334360>' },
  { pattern: ['Metro Ticket - Green'], emoji: '<:ahit_metroticketgreen:1400022729633169478>' },
  { pattern: ['Metro Ticket - Blue'], emoji: '<:ahit_metroticketblue:1400022719717965854>' },
  { pattern: ['Metro Ticket - Pink'], emoji: '<:ahit_metroticketpink:1400022741322698772>' },
  { pattern: [/Snatcher's Contract.*/], emoji: '<:ahit_contract:1400022842208419850>' },
  { pattern: [/Zipline Unlock.*/], emoji: '<:ahit_zipline:1400022874609160224>' },
]

export const gameIcons: GameIcons = {
  'A Hat in Time': '<:ahit:1400024234683662477>',
}

export const itemIcons: ItemIcons = {
  'A Hat in Time': ahitItemIcons,
}
