import { GameIcons, ItemTierIcons, ItemIcons } from '../types/icon-types.js'

import { actIcons } from './matchers/act.js'
import { adokuIcons } from './matchers/adoku.js'
import { ahitItemIcons } from './matchers/ahit.js'
import { bingoIcons } from './matchers/bingo.js'
import { celeste64Icons } from './matchers/celeste64.js'
import { celesteIcons } from './matchers/celeste.js'
import { hkIcons } from './matchers/hk.js'
import { kssIcons } from './matchers/kss.js'
import { ladxIcons } from './matchers/ladx.js'
import { lmIcons } from './matchers/lm.js'
import { mcIcons } from './matchers/mc.js'
import { mcdigIcons } from './matchers/mcdig.js'
import { mmIcons } from './matchers/mm.js'
import { mfIcons } from './matchers/mf.js'
import { mlssIcons } from './matchers/mlss.js'
import { mzmIcons } from './matchers/mzm.js'
import { ootIcons } from './matchers/oot.js'
import { ootSohIcons } from './matchers/ootSoh.js'
import { paintIcons } from './matchers/paint.js'
import { ppwiiIcons } from './matchers/ppwii.js'
import { pikmin2Icons } from './matchers/pikmin2.js'
import { ror2Icons } from './matchers/ror2.js'
import { sm64Icons } from './matchers/sm64.js'
import { smsIcons } from './matchers/sms.js'
import { smwIcons } from './matchers/smw.js'
import { smIcons } from './matchers/sm.js'
import { smMapRandoIcons } from './matchers/smMapRando.js'
import { smz3Icons } from './matchers/smz3.js'
import { terrariaIcons } from './matchers/terraria.js'
import { th6Icons } from './matchers/th6.js'
import { tmcIcons } from './matchers/tmc.js'
import { ttydIcons } from './matchers/ttyd.js'
import { twwIcons } from './matchers/tww.js'
import { undertaleIcons } from './matchers/undertale.js'
import { unfairflipsIcons } from './matchers/unfairflips.js'
import { ttIcons } from './matchers/tt.js'
import { wl4Icons } from './matchers/wl4.js'
import { wordIcons } from './matchers/word.js'
import { yachtDiceIcons } from './matchers/yachtDice.js'

export const gameIcons: GameIcons = {
  'A Hat in Time': 'ahit',
  "Another Crab's Treasure": 'act',
  'APBingo': ':8ball:',
  'Archipeladoku': ':1234:',
  'Celeste 64': 'celeste64',
  'Celeste (Open World)': 'celeste',
  'Hollow Knight': 'hk',
  'Kirby Super Star': 'kss',
  "Link's Awakening DX": 'ladx',
  "Luigi's Mansion": 'lm_alticon',
  "Majora's Mask Recompiled": 'mm',
  'Mario & Luigi Superstar Saga': 'mlss',
  'Metroid Fusion': 'mf',
  'Metroid Zero Mission': 'mzm',
  'Minecraft': 'mc',
  'Minecraft Dig': 'mc',
  'Ocarina of Time': 'oot_timetravel',
  'Paint': ':paintbrush:',
  'PokePark': 'ppwii',
  'Pikmin 2': 'pikmin2',
  'Risk of Rain 2': 'ror2',
  'Ship of Harkinian': 'oot_timetravel',
  'Super Mario 64': 'sm64alt',
  'Super Mario Sunshine': 'sms',
  'Super Mario World': 'smw',
  'Super Metroid': 'sm',
  'Super Metroid Map Rando': 'smmr',
  'SMZ3': 'smz3',
  'Terraria': 'terraria',
  'Touhou Koumakyou ~ the Embodiment of Scarlet Devil': 'th6',
  'The Minish Cap': 'tmc',
  'The Wind Waker': 'tww',
  'Undertale': 'undertale',
  'Unfair Flips': ':coin:',
  'Toontown': 'tt',
  'Paper Mario: The Thousand-Year Door': 'ttyd',
  'Wario Land 4': 'wl4',
  'Wordipelago': ':memo:',
  'Yacht Dice': 'yd',
}

export const itemIcons: ItemIcons = {
  'A Hat in Time': ahitItemIcons,
  "Another Crab's Treasure": actIcons,
  'APBingo': bingoIcons,
  'Archipeladoku': adokuIcons,
  'Celeste 64': celeste64Icons,
  'Celeste (Open World)': celesteIcons,
  'Hollow Knight': hkIcons,
  'Kirby Super Star': kssIcons,
  "Link's Awakening DX": ladxIcons,
  "Luigi's Mansion": lmIcons,
  "Majora's Mask Recompiled": mmIcons,
  'Mario & Luigi Superstar Saga': mlssIcons,
  'Metroid Fusion': mfIcons,
  'Metroid Zero Mission': mzmIcons,
  'Minecraft': mcIcons,
  'Minecraft Dig': mcdigIcons,
  'Ocarina of Time': ootIcons,
  'Paint': paintIcons,
  'PokePark': ppwiiIcons,
  'Pikmin 2': pikmin2Icons,
  'Risk of Rain 2': ror2Icons,
  'Ship of Harkinian': ootSohIcons,
  'Super Mario 64': sm64Icons,
  'Super Mario Sunshine': smsIcons,
  'Super Mario World': smwIcons,
  'Super Metroid': smIcons,
  'Super Metroid Map Rando': smMapRandoIcons,
  'SMZ3': smz3Icons,
  'Terraria': terrariaIcons,
  'Touhou Koumakyou ~ the Embodiment of Scarlet Devil': th6Icons,
  'The Minish Cap': tmcIcons,
  'The Wind Waker': twwIcons,
  'Undertale': undertaleIcons,
  'Unfair Flips': unfairflipsIcons,
  'Toontown': ttIcons,
  'Paper Mario: The Thousand-Year Door': ttydIcons,
  'Wario Land 4': wl4Icons,
  'Wordipelago': wordIcons,
  'Yacht Dice': yachtDiceIcons,
}

export const itemTierIcons: ItemTierIcons = {
  'progression': 'circle_progression',
  'useful': 'circle_useful',
  'filler': 'circle_junk',
  'trap': 'circle_trap',
}
