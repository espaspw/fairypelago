import { ArchipelagoMessageType } from './archipelago-types.js';

export interface SessionOptions {
  whitelistedMessageTypes: ArchipelagoMessageType[]
  enablePlayerIcons: boolean;
  enableGameIcons: boolean;
  enableItemIcons: boolean;
  hideFoundHints: boolean;
}
