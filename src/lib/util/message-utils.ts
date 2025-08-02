export function splitMessage(text: string, len = 2000) {
  if (text.length <= len) return [text];
  const output = []
  for (let i = 0; i < text.length; i += len) {
    output.push(text.substring(i, i + len))
  }
  return output
}

export async function sendDiscordTextMessage(method: (input: string) => Promise<void>, textMessage: string, len = 2000) {
  for (const part of splitMessage(textMessage, len)) {
    await method(part)
  }
}
