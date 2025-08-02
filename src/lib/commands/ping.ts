import { Command } from '../../types/command'

const ping: Command = {
  name: 'Ping',
  aliases: ['ping'],
  categories: ['Utility'],
  description: 'Print round-trip latency between Discord and the bot.',
  async execute(message) {
    const pong = await message.channel.send('pong')
    const latency = pong.createdTimestamp - message.createdTimestamp
    await message.channel.send(`Latency: ${latency}ms`)
  },
}

export default ping
