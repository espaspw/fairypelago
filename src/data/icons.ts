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

const lmIcons: IconMatcher[] = [
  { pattern: ['Heart Key'], emoji: '<:lm_heartkey:1401056731785596999>' },
  { pattern: ['Club Key'], emoji: '<:lm_clubkey:1401056693529608312>' },
  { pattern: ['Diamond Key'], emoji: '<:lm_diamondkey:1401056704543723640>' },
  { pattern: ['Spade Key'], emoji: '<:lm_spadekey:1401056715675537418>' },
  { pattern: [/.*Key/], emoji: '<:lm_key:1401056743462535178>' },
  { pattern: ['Fire Element Medal'], emoji: '<:lm_fireelementmedal:1401056772591980544>' },
  { pattern: ['Water Element Medal'], emoji: '<:lm_waterelementmedal:1401056802900283464>' },
  { pattern: ['Ice Element Medal'], emoji: '<:lm_iceelementmedal:1401056781186105385>' },
  { pattern: ["Mario's Glove"], emoji: '<:lm_marioglove:1401056838375440464>' },
  { pattern: ["Mario's Hat"], emoji: '<:lm_mariohat:1401056848664203406>' },
  { pattern: ["Mario's Letter"], emoji: '<:lm_marioletter:1401056862513659994>' },
  { pattern: ["Mario's Star"], emoji: '<:lm_mariostar:1401056881677439078>' },
  { pattern: ["Mario's Shoe"], emoji: '<:lm_marioshoe:1401056873670643742>' },
  { pattern: ['Boo Radar'], emoji: '<:lm_booradar:1401056681701544008>' },
  { pattern: ['Poltergust 4000'], emoji: '<:lm_poltergust4000:1401056812672876655>' },
  { pattern: ['Gold Diamond'], emoji: '<:lm_golddiamond:1401060433267261520>' },
  { pattern: ['Progressive Flower'], emoji: '<:lm_flower:1401060459674861699>' },
  { pattern: [/.*Boo.*/], emoji: '<:lm_boo:1401056671899451412>' },
  { pattern: [/Boolossus MiniBoo [0-9]+/], emoji: '<:lm_boo:1401056671899451412>' },
  { pattern: [
    '20 Coins & Bills',
    /[0-9]+ Coins/,
    /[0-9]+ Bills/,
    /[0-9]+ Gold Bars/,
  ], emoji: '<:lm_bills:1401056618090594405>' },
  { pattern: [
    'Sapphire',
    'Emerald',
    'Ruby',
    'Diamond',
  ], emoji: '<:lm_jewel:1401056654505545759>' },
]

const sm64Icons: IconMatcher[] = [
  { pattern: ['Power Star'], emoji: '<:sm64_star:1401050056752365709>' },
  { pattern: [/.*Key/], emoji: '<:sm64_key:1401050009985745007>' },
  { pattern: ['Wing Cap'], emoji: '<:sm64_wingcap:1401050037085278262>' },
  { pattern: ['Metal Cap'], emoji: '<:sm64_metalcap:1401050018701377538>' },
  { pattern: ['Vanish Cap'], emoji: '<:sm64_vanishcap:1401050027320803399>' },
  { pattern: ['1Up Mushroom'], emoji: '<:sm64_1up:1401049992138985582>' },
  { pattern: [
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
  ], emoji: '<:sm64_move:1401050047654662174>' },
  { pattern: [/Cannon Unlock.*/], emoji: '<:sm64_cannon:1401049999768555612>' },
]

const yachtDiceIcons: IconMatcher[] = [
  { pattern: ['Dice'], emoji: '<:yd_dice:1400759791567110154>' },
  { pattern: ['Dice Fragment'], emoji: '<:yd_dicefragment:1400759802837078150>' },
  { pattern: ['Roll'], emoji: '<:yd_roll:1400759728551891086>' },
  { pattern: ['Roll Fragment'], emoji: '<:yd_rollfragment:1400759776564084868>' },
  { pattern: [/Category.*/], emoji: '<:yd_category:1400759827919274046>' },
  { pattern: [/.*Multiplier/], emoji: '<:yd_multiplier:1400761120339267605>' },
]

export const gameIcons: GameIcons = {
  'A Hat in Time': '<:ahit:1400024234683662477>',
  "Luigi's Mansion": '<:lm:1401056594501832734>',
  'Super Mario 64': '<:sm64:1401049975227678751>',
  'Yacht Dice': '<:yd:1400759208655192074>',
}

export const itemIcons: ItemIcons = {
  'A Hat in Time': ahitItemIcons,
  "Luigi's Mansion": lmIcons,
  'Super Mario 64': sm64Icons,
  'Yacht Dice': yachtDiceIcons,
}
