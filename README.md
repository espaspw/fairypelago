# Fairypelago

A discord bot for using discord channels as text clients for [Archipelago Multiworld](https://github.com/ArchipelagoMW/Archipelago).

## Supported Features

- **Forwarding and receiving player messages** through Discord
- Displaying network events with **item icons** for supported games
- Configurable **player icons** per server
- **Tracking of session state** through the network and webhost api
- **Detection of a room url** for supported webhosts to create a client thread


When a supported webhost room URL is detected, it will create a new thread which acts like a client for the AP session.

By default, *server commands* are prefixed with `.`, and *session commands* (AP-specific commands that can only be used in an active session room) are prefixed with `>`.

If __autojoin__ is enabled in guild settings, the bot will attempt to connect to the first slot in the player list as a "vessel", due to the limitation of clients must connecting through a player slot. Otherwise, it can be manually connected through the command `> connect <player slot name>`.

### Currently Supported Webhosts

- [archipelago.gg](https://archipelago.gg/)

### Currently Supported Game Icons

- <img src="assets/archipelago-icons/A Hat in Time/game.png" alt="A Hat in Time" width="19"> A Hat in Time
- <img src="assets/archipelago-icons/Another Crab&apos;s Treasure/act.png" alt="A Hat in Time" width="19"> Another Crab's Treasure
- 🎱 APBingo
- 🔢 Archipeladoku
- <img src="assets/archipelago-icons/Celeste/Celeste64/celeste64.png" alt="Celeste 64" width="19"> Celeste 64
- <img src="assets/archipelago-icons/Celeste/celeste.png" alt="Celeste (Open World)" width="19" > Celeste (Open World)
- <img src="assets/archipelago-icons/Hollow Knight/hk.png" alt="Hollow Knight" width="19" > Hollow Knight
- <img src="assets/archipelago-icons/Kirby Super Star/kss.png" alt="Kirby Super Star" width="19" > Kirby Super Star
- <img src="assets/archipelago-icons/Link&apos;s Awakening DX/ladx.png" alt="Link's Awakening DX" width="19" > Link's Awakening DX
-  <img src="assets/archipelago-icons/Luigi&apos;s Mansion/lm_alticon.png" alt="Luigi's Mansion" width="19" > Luigi's Mansion
- <img src="assets/archipelago-icons/Majora&apos;s Mask/mm.png" alt="Majora's Mask Recompiled" width="19" > Majora's Mask Recompiled
- <img src="assets/archipelago-icons/Mario & Luigi Superstar Saga/mlss.png" alt="Mario & Luigi Superstar Saga" width="19" > Mario & Luigi Superstar Saga
- <img src="assets/archipelago-icons/Metroid Fusion/mf.png" alt="Metroid Fusion" width="19" > Metroid Fusion
- <img src="assets/archipelago-icons/Metroid Zero Mission/mzm.png" alt="Metroid Zero Mission" width="19" > Metroid Zero Mission
- <img src="assets/archipelago-icons/Minecraft/mc.png" alt="Minecraft" width="19" > Minecraft
- <img src="assets/archipelago-icons/Minecraft/mc.png" alt="Minecraft Dig" width="19" > Minecraft Dig
- <img src="assets/archipelago-icons/Ocarina of Time/oot_timetravel.png" alt="Ocarina of Time" width="19" > Ocarina of Time
- 🖌️ Paint
- <img src="assets/archipelago-icons/PokePark Wii Pikachu&apos;s Adventure/ppwii.png" alt="PokePark" width="19" > PokePark
- <img src="assets/archipelago-icons/Pikmin 2/pikmin2.png" alt="Pikmin 2" width="19" > Pikmin 2
- <img src="assets/archipelago-icons/Risk of Rain 2/ror2.png" alt="Risk of Rain 2" width="19" > Risk of Rain 2
- <img src="assets/archipelago-icons/Ocarina of Time/oot_timetravel.png" alt="Ship of Harkinian" width="19" > Ship of Harkinian
-  <img src="assets/archipelago-icons/SM64EX/sm64alt.png" alt="Super Mario 64" width="19" > Super Mario 64
-  <img src="assets/archipelago-icons/Super Mario Sunshine/sms.png" alt="Super Mario Sunshine" width="19" > Super Mario Sunshine
-  <img src="assets/archipelago-icons/SMW/smw.png" alt="Super Mario World" width="19" > Super Mario World
-  <img src="assets/archipelago-icons/Super Metroid/sm.png" alt="Super Metroid" width="19" > Super Metroid
-  <img src="assets/archipelago-icons/Super Metroid/smmr.png" alt="Super Metroid Map Rando" width="19" > Super Metroid Map Rando
-  <img src="assets/archipelago-icons/Super Metroid/smz3.png" alt="SMZ3" width="19" > SMZ3
- <img src="assets/archipelago-icons/Terraria/terraria.png" alt="Terraria" width="19" >Terraria
- <img src="assets/archipelago-icons/Touhou Embodiment of Scarlet Devil/th6.png" alt="Touhou Koumakyou ~ the Embodiment of Scarlet Devil" width="19" > Touhou Koumakyou ~ the Embodiment of Scarlet Devil
- <img src="assets/archipelago-icons/The Minish Cap/tmc.png" alt="The Minish Cap" width="19" > The Minish Cap
- <img src="assets/archipelago-icons/The Wind Waker/tww.png" alt="The Wind Waker" width="19" > The Wind Waker
- <img src="assets/archipelago-icons/Undertale/undertale.png" alt="Undertale" width="19" > Undertale
- 🪙 Unfair Flips
- <img src="assets/archipelago-icons/Toontown/tt.png" alt="Toontown" width="19" > Toontown
- <img src="assets/archipelago-icons/Paper Mario The Thousand-Year Door/ttyd.png" alt="Paper Mario: The Thousand-Year Door" width="19" > Paper Mario: The Thousand-Year Door
- <img src="assets/archipelago-icons/Wario Land 4/wl4.png" alt="Wario Land 4" width="19" > Wario Land 4
- 📝 Wordipelago
- <img src="assets/archipelago-icons/Yacht Dice/yd_icon.png" alt="Yacht Dice" width="19" > Yacht Dice

### Item Types

Item messages are prefixed with different colors:

<img src="assets/archipelago-icons/_shared/circle_progression.png" alt="Progression green dot" width="19" > Progression
<img src="assets/archipelago-icons/_shared/circle_useful.png" alt="Progression green dot" width="19" > Useful
<img src="assets/archipelago-icons/_shared/circle_junk.png" alt="Progression green dot" width="19" > Filler
<img src="assets/archipelago-icons/_shared/circle_trap.png" alt="Progression green dot" width="19" > Trap

![alt text](/assets/docs/item-type-example1.png)

## Running the Bot

First a `.env` file is required to set up global variables with the following fields:
```
# Retrieved from the Discord application portal
DISCORD_BOT_TOKEN=
# Your Discord account's snowflake id
OWNER_ID=
```

### Docker
The bot comes with a **Dockerfile** to easily start instances of the bot.
On a Docker installed system, you can start the bot in detached mode in the repo's root directory:
```
docker compose up --build -d
```

### Manual

To run the bot manually, Node.js (20.2.0+) must first be installed on the system.
```
# Install dependencies
npm i
# Run the bot
npm start
```

### Icons

Icons are located in the assets folder and should be uploaded to your bot through the developer application portal. Note that Discord has a **limit of 2,000 emojis** for an application, and while this limit has not been reached yet with the current icon list, if it ever does, you should pick and choose which games to upload icons for.

## Contributing

### Adding Icons

To add icons for a new game, you can use this [file generator](https://espaspw.github.io/ap-icon-matcher-generator/ ) to create the script file for the game.
Not all mappings need to be filled, and it is recommended to coalesce mappings using regex when appropriate.

- `/src/data/matchers`: Item name to emoji mapping
- `/src/data/icons.ts`: Exporting item icons and define mappings for game names

