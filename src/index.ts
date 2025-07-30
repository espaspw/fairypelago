import 'dotenv/config'

import * as DB from './db/db'
import { ArchipelagoClientManager } from './lib/archipelago-client-manager'
import { makeDiscordClient } from './lib/discord-client'

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN

// TODO: Temp hardcoding for testing
await DB.setLogChannelId('1399097553567482007', '1399099341691420692')

const archClients = new ArchipelagoClientManager()
const discordClient = makeDiscordClient(archClients)

await discordClient.login(DISCORD_BOT_TOKEN)
