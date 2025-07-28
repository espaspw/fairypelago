import { Client as ArchClient } from 'archipelago.js'
import * as DC from 'discord.js'

import { type ArchipelagoRoomData } from './lib/scrape'
import { getLogChannelId } from './db/db'

export enum ArchipelagoMessageTypes {
  Connected,
  Disconnected,
  ItemSentProgression,
  ItemSentUseful,
  ItemSentFiller,
  ItemSentTrap,
  ItemHinted,
  ItemCheated,
  UserChat,
  ServerChat,
  UserCommand,
  ServerCommand,
  Goal,
}

export interface ClientOptions {
  whitelistedMessageTypes: ArchipelagoMessageTypes[]
}

export const defaultWhitelistedTypes = [
  ArchipelagoMessageTypes.Connected,
  ArchipelagoMessageTypes.Disconnected,
  ArchipelagoMessageTypes.ItemSentProgression,
  ArchipelagoMessageTypes.ItemSentTrap,
  ArchipelagoMessageTypes.ItemHinted,
  ArchipelagoMessageTypes.ItemCheated,
  ArchipelagoMessageTypes.UserChat,
  ArchipelagoMessageTypes.ServerChat,
  ArchipelagoMessageTypes.Goal,
]

const defaultClientOptions: ClientOptions = {
  whitelistedMessageTypes: defaultWhitelistedTypes,
}

export async function makeClient(channel: DC.TextChannel | DC.PublicThreadChannel, options?: ClientOptions = defaultClientOptions) {
  const whitelistedTypes = new Set(options.whitelistedMessageTypes)
  const client = new ArchClient()

  client.messages.on('connected', async (content, player, tags) => {
    if(!whitelistedTypes.has(ArchipelagoMessageTypes.Connected)) return;
    if(tags.includes('Discord')) return;
    const description = `**${player.alias}** playing ${player.game} has joined. (${tags.join(', ')})`
    const embed = new DC.EmbedBuilder()
      .setColor(0xC8E9A0)
      .setDescription(description)
    await channel.send({ embeds: [embed] })
  })

  client.messages.on('disconnected', async (content, player) => {
    if(!whitelistedTypes.has(ArchipelagoMessageTypes.Disconnected)) return;
    const description = `**${player.alias}** playing ${player.game} has left.`
    const embed = new DC.EmbedBuilder()
      .setColor(0xA13D63)
      .setDescription(description)
    await channel.send({ embeds: [embed] })
  })

  client.messages.on('itemSent', async (content, item) => {
    if (item.progression && !whitelistedTypes.has(ArchipelagoMessageTypes.ItemSentProgression)) return;
    if (item.useful && !item.progression && !whitelistedTypes.has(ArchipelagoMessageTypes.ItemSentUseful)) return;
    if (item.filler && !whitelistedTypes.has(ArchipelagoMessageTypes.ItemSentFiller)) return;
    if (item.trap && !whitelistedTypes.has(ArchipelagoMessageTypes.ItemSentTrap)) return;
    const color = (() => {
      if (item.progression) {
        return 0xF7A278
      } else if (item.useful) {
        return 0x6DD3CE
      } else if (item.filler) {
        return 0xEFFAFA
      } else if (item.trap) {
        return 0xA13D63
      } else {
        return 0x0
      }
    })()
    const description = (() => {
      if (item.sender.slot === item.receiver.slot) {
        return `**${item.sender.alias}** found their __${item.name}__ (${item.locationName}).`
      } else {
        return `**${item.sender.alias}** sent __${item.name}__ to **${item.receiver.alias}** (${item.locationName})` 
      }
    })()
    const embed = new DC.EmbedBuilder()
      .setColor(color)
      .setDescription(description)
    await channel.send({ embeds: [embed] })
  })

  client.messages.on('itemHinted', async (content, item) => {
    console.log(`${content} :: ${item.sender.alias} to ${item.receiver.alias} :: (${item.locationGame}.${item.locationName}) :: ${item.filler && 'Filler'} ${item.progression && 'Progression'} ${item.useful && 'Useful'}`)
  })

  client.messages.on('itemCheated', async (content, item) => {
    console.log(`${content} :: ${item.sender.alias} to ${item.receiver.alias} :: (${item.locationGame}.${item.locationName}) :: ${item.filler && 'Filler'} ${item.progression && 'Progression'} ${item.useful && 'Useful'}`)
  })

  client.messages.on('chat', async (content, player) => {
    if(!whitelistedTypes.has(ArchipelagoMessageTypes.UserChat)) return;

    const embed = new DC.EmbedBuilder()
      .setColor(0xDBABBE)
      .setDescription(`**${player.alias}** : ${content}`)
    await channel.send({ embeds: [embed] })
  })
  
  client.messages.on('serverChat', async (content) => {
    if(!whitelistedTypes.has(ArchipelagoMessageTypes.ServerChat)) return;

    const embed = new DC.EmbedBuilder()
      .setColor(0xDBABBE)
      .setDescription(`__**SERVER**__ : ${content}`)
    await channel.send({ embeds: [embed] })
  })

  client.messages.on('userCommand', async (content) => {
    if(!whitelistedTypes.has(ArchipelagoMessageTypes.UserCommand)) return;

    const embed = new DC.EmbedBuilder()
      .setColor(0xDBABBE)
      .setDescription(`**${player.alias}** :: ${content}`)
    await channel.send({ embeds: [embed] })
  })

  client.messages.on('adminCommand', async (content) => {
    if(!whitelistedTypes.has(ArchipelagoMessageTypes.ServerCommand)) return;

    const embed = new DC.EmbedBuilder()
      .setColor(0xDBABBE)
      .setDescription(`__**ADMIN**__ :: ${content}`)
    await channel.send({ embeds: [embed] })
  })

  client.messages.on('goaled', async (content, player) => {
    if(!whitelistedTypes.has(ArchipelagoMessageTypes.Goal)) return;

    const embed = new DC.EmbedBuilder()
      .setColor(0xEFAAC4)
      .setDescription(`**${player.alias}** has reached their objective!`)
    await channel.send({ embeds: [embed] })
  })

  return client
}
