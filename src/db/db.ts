import * as DC from 'discord.js'
import { JSONFilePreset } from 'lowdb/node'

import { ArchipelagoRoomData } from '../types/archipelago-types'
import { defaultWhitelistedTypes } from '../lib/archipelago-client'
import { ArchipelagoMessageType } from '../types/archipelago-types'

export const supportedFlags = ['replace-alias-with-emoji-if-exists'] as const

export type SupportedFlags = typeof supportedFlags[number]

export interface DBGuildSettings {
  whitelistedMessageTypes: ArchipelagoMessageType[]
  playerAliasToEmoji: { [key: string]: string }
  flags: Record<SupportedFlags, boolean>
  logChannelId?: DC.Snowflake
  commandPrefix?: string
}

export interface DBActiveMultiworld {
  guildId: DC.Snowflake
  channelId: DC.Snowflake
  roomData: ArchipelagoRoomData
  createdAt: Date
}

export interface DBData {
  guildSettings: { [key: DC.Snowflake]: DBGuildSettings }
  activeMultiworlds: DBActiveMultiworld[]
}

const baseData: DBData = {
  guildSettings: {},
  activeMultiworlds: [],
}

const defaultCommandPrefix = '.'

const createDefaultGuildSettingObject = (): DBGuildSettings => ({
  whitelistedMessageTypes: defaultWhitelistedTypes,
  playerAliasToEmoji: {},
})

const db = await JSONFilePreset('./storage/db.json', baseData)

export function getEmojiForPlayerAlias(guildId: DC.Snowflake, playerAlias: string): string | null {
  return db.data.guildSettings[guildId]?.playerAliasToEmoji[playerAlias] ?? null
}

export function getAllEmojisForPlayerAlias(guildId: DC.Snowflake): { [key: string]: string } | null {
  return db.data.guildSettings[guildId]?.playerAliasToEmoji ?? null
}

export async function setEmojiForPlayerAlias(guildId: DC.Snowflake, playerAlias: string, emoji: string) {
  if (db.data.guildSettings[guildId] === undefined) {
    db.data.guildSettings[guildId] = createDefaultGuildSettingObject()
  }
  db.data.guildSettings[guildId].playerAliasToEmoji[playerAlias] = emoji
  await db.write()
}

export async function removeEmojiForPlayerAlias(guildId: DC.Snowflake, playerAlias: string) {
  if (db.data.guildSettings[guildId] === undefined) {
    return;
  }
  delete db.data.guildSettings[guildId].playerAliasToEmoji[playerAlias]
  await db.write()
}

export async function removeAllEmojisForPlayerAlias(guildId: DC.Snowflake) {
  if (db.data.guildSettings[guildId] === undefined) {
    return;
  }
  db.data.guildSettings[guildId].playerAliasToEmoji = {}
  await db.write()
}

export function getFlag(guildId: DC.Snowflake, flagName: SupportedFlags): boolean {
  return db.data.guildSettings[guildId]?.flags[flagName] ?? false
}

export async function enableFlag(guildId: DC.Snowflake, flagName: SupportedFlags) {
  if (db.data.guildSettings[guildId] === undefined) {
    db.data.guildSettings[guildId] = createDefaultGuildSettingObject()
  }
  db.data.guildSettings[guildId].flags[flagName] = true
  await db.write()
}

export async function disableFlag(guildId: DC.Snowflake, flagName: SupportedFlags) {
  if (db.data.guildSettings[guildId] === undefined) {
    db.data.guildSettings[guildId] = createDefaultGuildSettingObject()
  }
  db.data.guildSettings[guildId].flags[flagName] = false
  await db.write()
}

export async function toggleFlag(guildId: DC.Snowflake, flagName: SupportedFlags) {
  if (db.data.guildSettings[guildId] === undefined) {
    db.data.guildSettings[guildId] = createDefaultGuildSettingObject()
  }
  db.data.guildSettings[guildId].flags[flagName] = !(db.data.guildSettings[guildId].flags[flagName] ?? false)
  await db.write()
  return db.data.guildSettings[guildId].flags[flagName]
}

export function getLogChannelId(guildId: DC.Snowflake): DC.Snowflake | null {
  return db.data.guildSettings[guildId]?.logChannelId ?? null
}

export async function setLogChannelId(guildId: DC.Snowflake, logChannelId: DC.Snowflake) {
  if (db.data.guildSettings[guildId] === undefined) {
    db.data.guildSettings[guildId] = createDefaultGuildSettingObject()
  }
  db.data.guildSettings[guildId].logChannelId = logChannelId
  await db.write()
}

export function getWhitelistedMessageTypes(guildId: DC.Snowflake): ArchipelagoMessageType[] | null {
  return db.data.guildSettings[guildId]?.whitelistedMessageTypes ?? null
}

export async function addWhitelistedMessageType(guildId: DC.Snowflake, ...messageTypes: ArchipelagoMessageType) {
  if (db.data.guildSettings[guildId] === undefined) {
    db.data.guildSettings[guildId] = createDefaultGuildSettingObject()
  }
  db.data.guildSettings[guildId].whitelistedMessageTypes.push(...messageTypes)
  await db.write()
}

export async function removeWhitelistedMessageType(guildId: DC.Snowflake, ...messageTypes: ArchipelagoMessageType) {
  if (db.data.guildSettings[guildId] === undefined) return;

  const currentTypes = new Set(db.data.guildSettings[guildId].whitelistedMessageTypes)
  messageTypes.forEach(type => currentTypes.delete(type))
  db.data.guildSettings[guildId].whitelistedMessageTypes = [...messageTypes]
  await db.write()
}

export function getCommandPrefix(guildId: DC.Snowflake): string {
  return db.data.guildSettings[guildId]?.commandPrefix ?? defaultCommandPrefix
}

export async function setCommandPrefix(guildId: DC.Snowflake, prefix: string) {
  if (db.data.guildSettings[guildId] === undefined) {
    db.data.guildSettings[guildId] = createDefaultGuildSettingObject()
  }
  db.data.guildSettings[guildId].commandPrefix = prefix
  await db.write()
}

// TODO: Add methods for maniping whitelist

export function findActiveMultiworld(guildId: DC.Snowflake, channelId: DC.Snowflake) {
  for (const multiworld of db.data.activeMultiworlds) {
    if (multiworld.guildId === guildId && multiworld.channelId === channelId) {
      return multiworld
    }
  }
  return null
}

export async function addActiveMultiworld(guildId: DC.Snowflake, channelId: DC.Snowflake, roomData: ArchipelagoRoomData) {
  const newMultiworld: DBActiveMultiworld = {
    guildId,
    channelId,
    roomData,
    createdAt: new Date(),
  }
  db.data.activeMultiworlds.push(newMultiworld)
  await db.write()
  return newMultiworld
}

export async function removeActiveMultiworld(guildId: DC.Snowflake, channelId: DC.Snowflake) {
  const idx = db.data.activeMultiworlds.findIndex(w => w.guildId === guildId && w.channelId === channelId)
  if (idx === -1) return;
  db.data.activeMultiworlds.splice(idx)
  await db.write()
}

export function getActiveMultiworlds() {
  return db.data.activeMultiworlds
}
