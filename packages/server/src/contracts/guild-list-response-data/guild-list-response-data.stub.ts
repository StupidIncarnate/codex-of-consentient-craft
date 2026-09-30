import { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import { guildListResponseDataContract } from './guild-list-response-data-contract';
import type { GuildListResponseData } from './guild-list-response-data-contract';

export const GuildListResponseDataStub = (): GuildListResponseData =>
  guildListResponseDataContract.parse([GuildListItemStub()]);
