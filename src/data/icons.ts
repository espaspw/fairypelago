import { GameIcons, ItemTierIcons, ItemIcons } from '../types/icon-types.js'

import { ahitItemIcons } from './matchers/ahit.js'
import { celeste64Icons } from './matchers/celeste64.js'
import { celesteIcons } from './matchers/celeste.js'
import { hkIcons } from './matchers/hk.js'
import { lmIcons } from './matchers/lm.js'
import { mmIcons } from './matchers/mm.js'
import { mfIcons } from './matchers/mf.js'
import { mlssIcons } from './matchers/mlss.js'
import { mzmIcons } from './matchers/mzm.js'
import { ootIcons } from './matchers/oot.js'
import { ootSohIcons } from './matchers/ootSoh.js'
import { ppwiiIcons } from './matchers/ppwii.js'
import { pikmin2Icons } from './matchers/pikmin2.js'
import { ror2Icons } from './matchers/ror2.js'
import { sm64Icons } from './matchers/sm64.js'
import { smsIcons } from './matchers/sms.js'
import { smwIcons } from './matchers/smw.js'
import { smIcons } from './matchers/sm.js'
import { smMapRandoIcons } from './matchers/smMapRando.js'
import { smz3Icons } from './matchers/smz3.js'
import { twwIcons } from './matchers/tww.js'
import { ttIcons } from './matchers/tt.js'
import { wl4Icons } from './matchers/wl4.js'
import { yachtDiceIcons } from './matchers/yachtDice.js'

export const gameIcons: GameIcons = {
  'A Hat in Time': 'ahit',
  'Celeste 64': 'celeste64',
  'Celeste (Open World)': 'celeste',
  'Hollow Knight': 'hk',
  "Luigi's Mansion": 'lm_alticon',
  "Majora's Mask Recompiled": 'mm',
  'Mario & Luigi Superstar Saga': 'mlss',
  'Metroid Fusion': 'mf',
  'Metroid Zero Mission': 'mzm',
  'Ocarina of Time': 'oot_timetravel',
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
  'The Wind Waker': 'tww',
  'Toontown': 'tt',
  'Wario Land 4': 'wl4',
  'Yacht Dice': 'yd',
}

export const itemIcons: ItemIcons = {
  'A Hat in Time': ahitItemIcons,
  'Celeste 64': celeste64Icons,
  'Celeste (Open World)': celesteIcons,
  'Hollow Knight': hkIcons,
  "Luigi's Mansion": lmIcons,
  "Majora's Mask Recompiled": mmIcons,
  'Mario & Luigi Superstar Saga': mlssIcons,
  'Metroid Fusion': mfIcons,
  'Metroid Zero Mission': mzmIcons,
  'Ocarina of Time': ootIcons,
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
  'The Wind Waker': twwIcons,
  'Toontown': ttIcons,
  'Wario Land 4': wl4Icons,
  'Yacht Dice': yachtDiceIcons,
}

export const itemTierIcons: ItemTierIcons = {
  'progression': 'circle_progression',
  'useful': 'circle_useful',
  'filler': 'circle_junk',
  'trap': 'circle_trap',
}
