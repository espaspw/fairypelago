import { Message, OmitPartialGroupDMChannel } from 'discord.js'

import { ArchipelagoSession } from '../lib/archipelago-session.js'
import { INotificationRequestsRepository } from '../db/interfaces.js'

export interface SessionCommandDeps {
  notificationRequestsRepo: INotificationRequestsRepository,
}

export interface SessionCommand {
  name: string;
  description: string;
  execute: (
    message: OmitPartialGroupDMChannel<Message<boolean>>,
    args: string[],
    session: ArchipelagoSession,
    deps: SessionCommandDeps,
  ) => Promise<void>;
}
