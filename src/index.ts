import 'dotenv/config'

import { ArchipelagoClientManager } from './lib/archipelago-client-manager'
import { makeDiscordClient } from './lib/discord-client'
import * as IconLookupTable from './lib/icon-lookup-table'
import { gameIcons, itemIcons, itemTierIcons } from './data/icons'

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN

const archClients = new ArchipelagoClientManager()
const discordClient = makeDiscordClient(archClients)

await discordClient.login(DISCORD_BOT_TOKEN)

await IconLookupTable.fetchApplicationEmojis(discordClient)
IconLookupTable.populateGameIcons(gameIcons)
IconLookupTable.populateItemIcons(itemIcons)
IconLookupTable.populateItemTierIcons(itemTierIcons)
