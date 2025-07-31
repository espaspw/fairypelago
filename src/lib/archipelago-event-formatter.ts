import { Item, Player } from "archipelago.js";
import { IconLookupTable } from "./icon-lookup-table";
import { EmbedBuilder, type MessageCreateOptions } from "discord.js";

function makeTimestamp() {
  return `<t:${Math.floor(Date.now() / 1000)}:T>`
}

function formatItemTagList(item: Item) {
  const tokens = [' |']
  if (item.progression) tokens.push(':purple_circle: Progression');
  if (item.useful) tokens.push(':blue_circle: Useful');
  if (item.filler) tokens.push(':white_circle: Junk');
  if (item.trap) tokens.push(':red_circle: Trap');
  if (tokens.length === 1) return '';
  return tokens.join(' ')
}

export class ArchipelagoEventFormatter {
  private #iconLookupTable: IconLookupTable

  constructor(iconLookupTable: IconLookupTable) {
    this.#iconLookupTable = iconLookupTable
  }

  connected(content: string, player: Player, tags: string[]): MessageCreateOptions | null {
    if(tags.includes('Discord')) return null; // Prevent triggering on its own join
    const descriptionTokens = [`${makeTimestamp()} | **${player.alias}** playing __${player.game}__ has joined.`]
    if (tags.length !== 0) { descriptionTokens.push(`(${tags.join(', ')})`) }
    const embed = new EmbedBuilder()
      .setColor(0xC8E9A0)
      .setDescription(descriptionTokens.join(' '))
    return { embeds: [embed] }
  }

  disconnected(content: string, player: Player): MessageCreateOptions {
    const description = `${makeTimestamp()} | **${player.alias}** playing ${player.game} has left.`
    const embed = new EmbedBuilder()
      .setColor(0xA13D63)
      .setDescription(description)
    return { embeds: [embed] }
  }

  itemSent(content: string, item: Item): MessageCreateOptions {
    const header = `> -# ${makeTimestamp()} | ${item.locationGame} - **${item.locationName}**${formatItemTagList(item)}`
    const body = (() => {
      if (item.sender.slot === item.receiver.slot) {
        return `> __${item.sender.alias}__ found their **${item.name}**`
      } else {
        return `> __${item.sender.alias}__ sent **${item.name}** to __${item.receiver.alias}__` 
      }
    })()
    return { content: [header, body].join('\n') }
  }

  itemHinted(content: string, item: Item): MessageCreateOptions {
    const embed = new EmbedBuilder()
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
    return { embeds: [embed] }
  }

  itemCheated(content: string, item: Item): MessageCreateOptions {
    const header = `> -# ${makeTimestamp()} | Cheat`
    const body = (() => {
      if (item.sender.slot === item.receiver.slot) {
        return `> **${item.name}** was given to __${item.receiver.alias}__, which was located at **${item.locationName}`
      } else {
        return `> **${item.name}** was forcefully transfered from __${item.sender.alias}__ to __${item.receiver.alias}__, which was located at **${item.locationName}`
      }
    })()
    return { content: [header, body].join('\n') }
  }

  chat(content: string, player: Player): MessageCreateOptions | null {
    // Prevent triggering on forwarded messages from discord
    if (content.includes('[DISCORD]')) return null;

    const embed = new EmbedBuilder()
      .setColor(0xDBABBE)
      .setDescription(`${makeTimestamp()} | **${player.alias}** : ${content}`)
    return { embeds: [embed] }
  }

  serverChat(content: string): MessageCreateOptions {
    const embed = new EmbedBuilder()
      .setColor(0xDBABBE)
      .setDescription(`${makeTimestamp()} | __**SERVER**__ : ${content}`)
    return { embeds: [embed] }
  }

  userCommand(content: string): MessageCreateOptions {
    const embed = new EmbedBuilder()
      .setColor(0xDBABBE)
      .setDescription(`${makeTimestamp()} | **${player.alias}** :: ${content}`)
    return { embeds: [embed] }
  }

  adminCommand(content: string): MessageCreateOptions {
    const embed = new EmbedBuilder()
      .setColor(0xDBABBE)
      .setDescription(`${makeTimestamp()} | __**ADMIN**__ :: ${content}`)
    return { embeds: [embed] }
  }

  goaled(content: string, player: Player): MessageCreateOptions {
    const embed = new EmbedBuilder()
      .setColor(0xEFAAC4)
      .setDescription(`${makeTimestamp()} | **${player.alias}** has reached their objective!`)
    return { embeds: [embed] }
  }
}