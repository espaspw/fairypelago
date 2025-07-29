import { Client as ArchClient, SocketError } from 'archipelago.js'
import * as DC from 'discord.js'
import emojiFromText from 'emoji-from-text'

import { ArchipelagoMessageType, type ArchipelagoRoomData } from '../types/archipelago-types'


export interface ClientOptions {
  whitelistedMessageTypes: ArchipelagoMessageType[]
}

export const defaultWhitelistedTypes = [
  ArchipelagoMessageType.Connected,
  ArchipelagoMessageType.Disconnected,
  ArchipelagoMessageType.ItemSentProgression,
  ArchipelagoMessageType.ItemSentTrap,
  ArchipelagoMessageType.ItemHinted,
  ArchipelagoMessageType.ItemCheated,
  ArchipelagoMessageType.UserChat,
  ArchipelagoMessageType.ServerChat,
  ArchipelagoMessageType.Goal,
]

const defaultClientOptions: ClientOptions = {
  whitelistedMessageTypes: defaultWhitelistedTypes,
}

export enum ClientState {
  Stopped,
  Running,
  Failure,
}

// TODO: Maybe have this store RoomData as well? Right now weak association with Rooms
export class ArchipelagoClientWrapper {
  private #client: ArchClient
  state: ClientState = ClientState.Stopped
  lastError: Error | null = null
  private #whitelistedTypes: Set<ArchipelagoMessageType>

  constructor(client: ArchClient, options: ClientOptions) {
    this.#client = client
    this.#whitelistedTypes = new Set(options.whitelistedMessageTypes)
  }

  isWhitelisted(msgType: ArchipelagoMessageType) {
    return this.#whitelistedTypes.has(msgType)
  }

  addWhitelistType(...msgType: ArchipelagoMessageType[]) {
    msgType.forEach(this.#whitelistedTypes.add)
  }

  removeWhitelistType(...msgType: ArchipelagoMessageType[]) {
    msgType.forEach(this.#whitelistedTypes.delete)
  }

  async start(roomData: ArchipelagoRoomData) {
    try {
      await this.#client.login(
        `archipelago.gg:${roomData.port}`,
        roomData.players[0].name,
        null,
        { tags: ['Discord'] },
      )
      this.state = ClientState.Running
    } catch (err) {
      if (err instanceof SocketError && err.message.includes('Failed to connect to Archipelago server.')) {
        this.state = ClientState.Failure
        this.lastError = err
      }
      this.state = ClientState.Stopped
    }
  }

  get client() {
    return this.#client
  }

  set client(cilent: ArchClient) {
    this.#client = cilent
  }
}

export async function makeClient(channel: DC.TextChannel | DC.PublicThreadChannel, options?: ClientOptions = defaultClientOptions) {
  const client = new ArchClient()
  const wrapper = new ArchipelagoClientWrapper(client, options)

  function makeTimestamp() {
    return `<t:${Math.floor(Date.now() / 1000)}:T>`
  }

  function getEmojifiedName(text: string) {
    const emoji = emojiFromText(text, true).match.toString()
    return `${emoji} ${text}`
  }

  client.messages.on('connected', async (content, player, tags) => {
    if(!wrapper.isWhitelisted(ArchipelagoMessageType.Connected)) return;
    if(tags.includes('Discord')) return; // Prevent triggering on its own join
    const descriptionTokens = [`${makeTimestamp()} | **${player.alias}** playing __${player.game}__ has joined.`]
    if (tags.length !== 0) { descriptionTokens.push(`(${tags.join(', ')})`) }
    const embed = new DC.EmbedBuilder()
      .setColor(0xC8E9A0)
      .setDescription(descriptionTokens.join(' '))
    await channel.send({ embeds: [embed] })
  })

  client.messages.on('disconnected', async (content, player) => {
    if(!wrapper.isWhitelisted(ArchipelagoMessageType.Disconnected)) return;
    const description = `${makeTimestamp()} | **${player.alias}** playing ${player.game} has left.`
    const embed = new DC.EmbedBuilder()
      .setColor(0xA13D63)
      .setDescription(description)
    await channel.send({ embeds: [embed] })
  })

  client.messages.on('itemSent', async (content, item) => {
    if (item.progression && !wrapper.isWhitelisted(ArchipelagoMessageType.ItemSentProgression)) return;
    if (item.useful && !item.progression && !wrapper.isWhitelisted(ArchipelagoMessageType.ItemSentUseful)) return;
    if (item.filler && !wrapper.isWhitelisted(ArchipelagoMessageType.ItemSentFiller)) return;
    if (item.trap && !wrapper.isWhitelisted(ArchipelagoMessageType.ItemSentTrap)) return;
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
    const header = `> -# ${makeTimestamp()} | ${item.locationGame} - **${item.locationName}** | ${item.progression ? 'Progression' : ''}`
    const body = (() => {
      if (item.sender.slot === item.receiver.slot) {
        return `> __${item.sender.alias}__ found their **${getEmojifiedName(item.name)}**`
      } else {
        return `> __${item.sender.alias}__ sent **${getEmojifiedName(item.name)}** to __${item.receiver.alias}__` 
      }
    })()
    await channel.send([header, body].join('\n'))
  })

  client.messages.on('itemHinted', async (content, item) => {
    if (!wrapper.isWhitelisted(ArchipelagoMessageType.ItemHinted)) return;
    if (content.includes('(found)')) return;
    const embed = new DC.EmbedBuilder()
      .setColor(0x947EB0)
      .setFields({
        name: 'Item',
        value: item.name,
        inline: true,
      }, {
        name: 'Location',
        value: item.locationName,
        inline: true,
      }, {
        name: 'World',
        value: item.sender.alias,
        inline: true,
      })
      .setFooter({ text: `Hint for ${item.receiver.alias}` })
      .setTimestamp()
    await channel.send({ embeds: [embed] })
  })

  client.messages.on('itemCheated', async (content, item) => {
    const header = `> -# ${makeTimestamp()} | Cheat`
    const body = (() => {
      if (item.sender.slot === item.receiver.slot) {
        return `> **${item.name}** was given to __${item.receiver.alias}__, which was located at **${item.locationName}`
      } else {
        return `> **${item.name}** was forcefully transfered from __${item.sender.alias}__ to __${item.receiver.alias}__, which was located at **${item.locationName}`
      }
    })()
    await channel.send([header, body].join('\n'))
  })

  client.messages.on('chat', async (content, player) => {
    if(!wrapper.isWhitelisted(ArchipelagoMessageType.UserChat)) return;

    // Prevent triggering on forwarded messages from discord
    if (content.includes('[DISCORD]')) return;

    const embed = new DC.EmbedBuilder()
      .setColor(0xDBABBE)
      .setDescription(`${makeTimestamp()} | **${player.alias}** : ${content}`)
    await channel.send({ embeds: [embed] })
  })
  
  client.messages.on('serverChat', async (content) => {
    if(!wrapper.isWhitelisted(ArchipelagoMessageType.ServerChat)) return;

    const embed = new DC.EmbedBuilder()
      .setColor(0xDBABBE)
      .setDescription(`${makeTimestamp()} | __**SERVER**__ : ${content}`)
    await channel.send({ embeds: [embed] })
  })

  client.messages.on('userCommand', async (content) => {
    if(!wrapper.isWhitelisted(ArchipelagoMessageType.UserCommand)) return;

    const embed = new DC.EmbedBuilder()
      .setColor(0xDBABBE)
      .setDescription(`${makeTimestamp()} | **${player.alias}** :: ${content}`)
    await channel.send({ embeds: [embed] })
  })

  client.messages.on('adminCommand', async (content) => {
    if(!wrapper.isWhitelisted(ArchipelagoMessageType.ServerCommand)) return;

    const embed = new DC.EmbedBuilder()
      .setColor(0xDBABBE)
      .setDescription(`${makeTimestamp()} | __**ADMIN**__ :: ${content}`)
    await channel.send({ embeds: [embed] })
  })

  client.messages.on('goaled', async (content, player) => {
    if(!wrapper.isWhitelisted(ArchipelagoMessageType.Goal)) return;

    const embed = new DC.EmbedBuilder()
      .setColor(0xEFAAC4)
      .setDescription(`${makeTimestamp()} | **${player.alias}** has reached their objective!`)
      .setImage(`https://tenor.com/view/touhou-touhou-project-rin-kaenbyou-dance-dancing-gif-20645477.gif`)
    await channel.send({ embeds: [embed] })
  })

  return wrapper
}
