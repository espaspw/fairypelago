import * as DC from 'discord.js'
import { logger } from './logger.js'
import { sendNewlineSplitDiscordTextMessage } from './message-utils.js'

// Wraps a discord channel, ensuring messages with the same tag sent within a time window are combined
// Null tags will always flush the buffer before sending the new message
export class CoalescingChannelWrapper<AllowedTags> {
  #channel: DC.TextChannel | DC.ThreadChannel
  #delayMs: number
  #buffer: string[] = []
  #currentTag: AllowedTags | null = null
  #timer: NodeJS.Timeout | null = null
  #queue: Promise<void> = Promise.resolve()

  // Soft limit for 2k Discord cap
  readonly #MAX_LENGTH = 1850

  constructor (channel: DC.TextChannel | DC.ThreadChannel, delayMs = 1000) {
    this.#channel = channel
    this.#delayMs = delayMs
  }

  get channel () {
    return this.#channel
  }

  async send (content: string | DC.MessageCreateOptions, tag: AllowedTags | null = null) {
    // A promise chain is used to prevent race conditions during large bursts
    this.#queue = this.#queue.then(async () => {
      await this.#processSend(content, tag)
    }).catch(err => {
      logger.error('Failed to send message', { error: err })
    })
  }

  async #processSend (content: string | DC.MessageCreateOptions, tag: AllowedTags | null = null) {
    const isEmbed = typeof content !== 'string'

    // If tag changes or it's an embed, flush existing buffer first to preserve sending order
    if (isEmbed || !tag || (tag !== this.#currentTag && this.#buffer.length > 0)) {
      await this.flush()
    }

    if (isEmbed) {
      await this.#channel.send(content)
      return
    }

    // Send message as newline split message if content by itself exceeds the max length
    if (content.length > this.#MAX_LENGTH) {
      await this.flush()
      await sendNewlineSplitDiscordTextMessage(
        this.#channel.send.bind(this.#channel),
        content,
        this.#MAX_LENGTH,
      )
      return
    }

    // If new message exceeds discord limit, flush the buffer
    const potentialLength = this.#buffer.join('\n').length + content.length + 1
    if (potentialLength > this.#MAX_LENGTH) {
      await this.flush()
    }

    this.#buffer.push(content)
    this.#currentTag = tag

    // Flush immediately if the tag is null
    if (!tag) {
      await this.flush()
    } else {
      this.#resetTimer()
    }
  }

  #resetTimer () {
    if (this.#timer) clearTimeout(this.#timer)
    this.#timer = setTimeout(() => this.flush(), this.#delayMs)
  }

  // Sends coalesced message from the buffer
  async flush () {
    if (this.#timer) {
      clearTimeout(this.#timer)
      this.#timer = null
    }

    if (this.#buffer.length === 0) return

    const finalMessage = this.#buffer.join('\n')
    this.#buffer = []
    this.#currentTag = null

    // Last emergency check to prevent Discord API error
    if (finalMessage.length <= 0) return

    try {
      await this.#channel.send(finalMessage)
    } catch (err) {
      logger.error('Failed to send coalesced message when flushing buffer', { error: err })
    }
  }
}
