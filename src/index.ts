import 'dotenv/config'

import * as DB from './db/db'
import { ArchipelagoClientManager } from './lib/archipelago-client-manager'
import { makeDiscordClient } from './lib/discord-client'
import { IconLookupTable } from './lib/icon-lookup-table'
import { gameIcons, itemIcons } from './data/icons'
import { ArchipelagoEventFormatter } from './lib/archipelago-event-formatter'

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN

// TODO: Temp hardcoding for testing
await DB.setLogChannelId('1399097553567482007', '1399099341691420692')

const iconLookupTable = new IconLookupTable()
  .populateGameIcons(gameIcons)
  .populateItemIcons(itemIcons)
const archEventFormatter = new ArchipelagoEventFormatter(iconLookupTable)

const archClients = new ArchipelagoClientManager(archEventFormatter)
const discordClient = makeDiscordClient(archClients)

await discordClient.login(DISCORD_BOT_TOKEN)
