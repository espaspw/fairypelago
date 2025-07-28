import * as DC from 'discord.js'
import { JSONFilePreset } from 'lowdb/node'

import { ArchipelagoRoomData } from '../lib/scrape'
import { ArchipelagoMessageTypes, defaultWhitelistedTypes } from '../archipelago-client'

export interface DBGuildSettings {
  whitelistedMessageTypes: ArchipelagoMessageTypes[]
  logChannelId?: DC.Snowflake
}

type GuildSettingsMapping = { [key: DC.Snowflake]: DBGuildSettings }
type ChannelToRoomDataMapping = { [key: DC.Snowflake]: ArchipelagoRoomData }
type ChannelToTimestampMapping = { [key: DC.Snowflake]: Date }

export interface DBData {
  channelToRoomData: ChannelToRoomDataMapping
  channelToTimestamp: ChannelToTimestampMapping
  guildSettings: GuildSettingsMapping
}

const baseData: DBData = {
  guildToChannel: {},
  channelToRoomData: {},
  channelToTimestamp: {},
  guildSettings: {},
}

const createDefaultGuildSettingObject = () => ({
  whitelistedMessageTypes: defaultWhitelistedTypes
})

const db = await JSONFilePreset('db.json', baseData)

// Register guild
// Create empty settings option for each guild
// Iterate through bot guild list on startup and register

export async function setLogChannelId(guildId: DC.Snowflake, logChannelId: DC.Snowflake) {
  if (db.data.guildSettings[guildId] === undefined) {
    db.data.guildSettings[guildId] = createDefaultGuildSettingObject()
  }
  db.data.guildSettings[guildId].logChannelId = logChannelId
  await db.write()
}

export function getLogChannelId(guildId: DC.Snowflake): DC.Snowflake | null {
  return db.data.guildSettings[guildId]?.logChannelId ?? null
}

export async function addActiveRoom(channelId: DC.Snowflake, roomData: ArchipelagoRoomData) {
  db.data.channelToRoomData[channelId] = roomData
  db.data.channelToTimestamp[channelId] = new Date()
  await db.write()
}

export async function removeActiveRoom(channelId: DC.Snowflake) {
  delete db.data.channelToRoomData[channelId]
  delete db.data.channelToTimestamp[channelId]
  await db.write()
}

export function isChannelOfActiveRoom(channelId: DC.Snowflake) {
  return channelId in db.data.channelToRoomData
}

export function getAllRoomData() {
  return Object.entries(db.data.channelToRoomData)
}
