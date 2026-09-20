import type { StubArgument } from '@dungeonmaster/shared/@types';
import { GuildStub } from '@dungeonmaster/shared/contracts';

import { guildListingContract } from './guild-listing-contract';
import type { GuildListing } from './guild-listing-contract';

export const GuildListingStub = ({ ...props }: StubArgument<GuildListing> = {}): GuildListing =>
  guildListingContract.parse({
    guilds: [GuildStub()],
    ...props,
  });
