import { EmbedBuilder, Message } from 'discord.js'

export function splitMessage(text: string, len = 2000) {
  if (text.length <= len) return [text];
  const output = []
  for (let i = 0; i < text.length; i += len) {
    output.push(text.substring(i, i + len))
  }
  return output
}

export async function sendSplitDiscordTextMessage(method: (input: string) => Promise<void>, textMessage: string, len = 2000) {
  for (const part of splitMessage(textMessage, len)) {
    await method(part)
  }
}

export async function sendNewlineSplitDiscordTextMessage(method: (input: string) => Promise<void>, textMessage: string, len = 2000) {
  if (textMessage.length <= len) {
    await method(textMessage);
    return;
  }
  const tokens = textMessage.split('\n')
  const output = []
  let runningLen = 0
  let currMessageParts = []
  for (const token of tokens) {
    if (token.length >= len) {
      await sendSplitDiscordTextMessage(method, token, len)
    }
    if (runningLen + token.length >= len) {
      output.push(currMessageParts.join('\n'))
      currMessageParts = [token]
      runningLen = token.length
    } else {
      runningLen += token.length
      currMessageParts.push(token)
    }
  }
  if (currMessageParts.length > 0) {
    output.push(currMessageParts.join('\n'))
  }
  for (const messagePiece of output) {
    await method(messagePiece)
  }
}

export async function replyWithError(message: Message, text: string) {
  const embed = new EmbedBuilder()
    .setDescription(text)
    .setColor(0xb71c1c)
  await message.reply({ embeds: [embed] })
}
