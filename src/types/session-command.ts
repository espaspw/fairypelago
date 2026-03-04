import { Message, OmitPartialGroupDMChannel } from 'discord.js'
import { ArchipelagoSession } from '../lib/archipelago-session.js'

export interface SessionCommand {
  name: string;
  description: string;
  execute: (
    message: OmitPartialGroupDMChannel<Message<boolean>>,
    args: string[],
    session: ArchipelagoSession
  ) => Promise<void>;
}
