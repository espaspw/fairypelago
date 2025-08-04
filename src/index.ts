import 'dotenv/config'

import { ArchipelagoClientManager } from './lib/archipelago-client-manager'
import { makeDiscordClient } from './lib/discord-client'
import * as IconLookupTable from './lib/icon-lookup-table'
import { gameIcons, itemIcons, itemTierIcons } from './data/icons'
import { ArchipelagoEventFormatter } from './lib/archipelago-event-formatter'

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN

const archEventFormatter = new ArchipelagoEventFormatter()

const archClients = new ArchipelagoClientManager(archEventFormatter)
const discordClient = makeDiscordClient(archClients)

await discordClient.login(DISCORD_BOT_TOKEN)

await IconLookupTable.fetchApplicationEmojis(discordClient)
IconLookupTable.populateGameIcons(gameIcons)
IconLookupTable.populateItemIcons(itemIcons)
IconLookupTable.populateItemTierIcons(itemTierIcons)
