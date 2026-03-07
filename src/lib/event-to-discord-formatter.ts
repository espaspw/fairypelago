import { Item, Player } from 'archipelago.js'
import { EmbedBuilder, Snowflake, type MessageCreateOptions } from 'discord.js'

import * as IconLookupTable from './icon-lookup-table.js'
import { IGuildSettingsRepository } from '../db/interfaces.js'

function makeTimestamp () {
  return `<t:${Math.floor(Date.now() / 1000)}:T>`
}

function formatItemTagList (item: Item) {
  const tokens = []
  if (item.progression) tokens.push(IconLookupTable.getItemTierIcon('progression') ?? 'Progression')
  else if (item.useful) tokens.push(IconLookupTable.getItemTierIcon('useful') ?? 'Useful')
  else if (item.filler) tokens.push(IconLookupTable.getItemTierIcon('filler') ?? 'Junk')
  else if (item.trap) tokens.push(IconLookupTable.getItemTierIcon('trap') ?? 'Trap')
  if (tokens.length === 0) return ''
  return tokens.join(' ')
}

const forwardedMsgRegex = /\[[a-zA-Z0-9_.]+\] :: .*/
function isForwardedMessage (message: string) {
  return forwardedMsgRegex.test(message)
}

export class EventToDiscordFormatter {
  #guildId: Snowflake
  #settingsRepo: IGuildSettingsRepository

  constructor (guildId: Snowflake, settingsRepo: IGuildSettingsRepository) {
    this.#guildId = guildId
    this.#settingsRepo = settingsRepo
  }

  formatGame (item: Item) {
    const r = IconLookupTable.lookupGame(item.sender.game)
    if (r === null) return item.sender.game
    return r
  }

  formatItem (item: Item) {
    const r = IconLookupTable.lookupItem(item.game, item.name)
    if (r === null) return item.name
    return `${r} ${item.name}`
  }

  async #formatPlayer (alias: string) {
    const {
      sessionOptions: { enablePlayerIcons },
      playerEmojis,
    } = await this.#settingsRepo.getSettings(this.#guildId)

    const playerEmoji = playerEmojis[alias]
    if (!playerEmoji) return `__${alias}__`
    if (enablePlayerIcons) {
      return playerEmoji
    } else {
      return `${playerEmoji} __${alias}__`
    }
  }

  async connected (content: string, player: Player, tags: string[]): Promise<MessageCreateOptions | null> {
    if (tags.includes('Discord')) return null // Prevent triggering on its own join
    const descriptionTokens = [`${makeTimestamp()} | **${await this.#formatPlayer(player.alias)}** playing __${player.game}__ has joined.`]
    if (tags.length !== 0) { descriptionTokens.push(`(${tags.join(', ')})`) }
    const embed = new EmbedBuilder()
      .setColor(0xC8E9A0)
      .setDescription(descriptionTokens.join(' '))
    return { embeds: [embed] }
  }

  async disconnected (content: string, player: Player): Promise<MessageCreateOptions> {
    const description = `${makeTimestamp()} | **${await this.#formatPlayer(player.alias)}** playing ${player.game} has left.`
    const embed = new EmbedBuilder()
      .setColor(0xA13D63)
      .setDescription(description)
    return { embeds: [embed] }
  }

  async itemSent (content: string, item: Item): Promise<MessageCreateOptions> {
    const header = `> -# ${makeTimestamp()} | ${this.formatGame(item)} - **${item.locationName}**`
    const body = await (async () => {
      if (item.sender.slot === item.receiver.slot) {
        return `> ${formatItemTagList(item)} ${await this.#formatPlayer(item.sender.alias)} found **${this.formatItem(item)}**`
      } else {
        return `> ${formatItemTagList(item)} ${await this.#formatPlayer(item.sender.alias)} sent **${this.formatItem(item)}** to ${await this.#formatPlayer(item.receiver.alias)}`
      }
    })()
    return { content: [header, body].join('\n') }
  }

  async itemHinted (content: string, item: Item): Promise<MessageCreateOptions> {
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

  async itemCheated (content: string, item: Item): Promise<MessageCreateOptions> {
    const header = `> -# ${makeTimestamp()} | Cheat`
    const body = await (async () => {
      if (item.sender.slot === item.receiver.slot) {
        return `> **${this.formatItem(item)}** was given to ${await this.#formatPlayer(item.receiver.alias)}, which was located at **${item.locationName}`
      } else {
        return `> **${this.formatItem(item)}** was forcefully transfered from ${await this.#formatPlayer(item.sender.alias)} to ${await this.#formatPlayer(item.receiver.alias)}, which was located at **${item.locationName}`
      }
    })()
    return { content: [header, body].join('\n') }
  }

  async chat (content: string, player: Player): Promise<MessageCreateOptions | null> {
    // Prevent triggering on forwarded messages from discord
    if (isForwardedMessage(content)) return null

    const embed = new EmbedBuilder()
      .setColor(0xDBABBE)
      .setDescription(`${makeTimestamp()} | **${player.alias}** : ${content}`)
    return { embeds: [embed] }
  }

  async serverChat (content: string): Promise<MessageCreateOptions> {
    const embed = new EmbedBuilder()
      .setColor(0xDBABBE)
      .setDescription(`${makeTimestamp()} | __**SERVER**__ : ${content}`)
    return { embeds: [embed] }
  }

  async userCommand (content: string): Promise<MessageCreateOptions> {
    const embed = new EmbedBuilder()
      .setColor(0xDBABBE)
      .setDescription(`${makeTimestamp()} | **USER** :: ${content}`)
    return { embeds: [embed] }
  }

  async adminCommand (content: string): Promise<MessageCreateOptions> {
    const embed = new EmbedBuilder()
      .setColor(0xDBABBE)
      .setDescription(`${makeTimestamp()} | __**ADMIN**__ :: ${content}`)
    return { embeds: [embed] }
  }

  async collected (content: string, player: Player): Promise<MessageCreateOptions> {
    const descriptionTokens = [`${makeTimestamp()} | **${await this.#formatPlayer(player.alias)}** has collected all their items in __${player.game}__!`]
    const embed = new EmbedBuilder()
      .setColor(0xC8E9A0)
      .setDescription(descriptionTokens.join(' '))
    return { embeds: [embed] }
  }

  async goaled (content: string, player: Player): Promise<MessageCreateOptions> {
    const embed = new EmbedBuilder()
      .setColor(0xEFAAC4)
      .setDescription(`${makeTimestamp()} | **${await this.#formatPlayer(player.alias)}** has reached their objective!`)
      .setImage('https://64.media.tumblr.com/e93889ced23679be7a390829ff4f08c2/tumblr_on14f9HeMl1v857c1o1_400.gif')
    return { embeds: [embed] }
  }

  async released (content: string, player: Player): Promise<MessageCreateOptions> {
    const embed = new EmbedBuilder()
      .setColor(0xEFAAC4)
      .setDescription(`${makeTimestamp()} | **${await this.#formatPlayer(player.alias)}**'s world has been released!`)
    return { embeds: [embed] }
  }
}
