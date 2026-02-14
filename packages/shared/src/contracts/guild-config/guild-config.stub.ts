import type { StubArgument } from '@dungeonmaster/shared/@types';

import { guildConfigContract } from './guild-config-contract';
import type { GuildConfig } from './guild-config-contract';

export const GuildConfigStub = ({ ...props }: StubArgument<GuildConfig> = {}): GuildConfig =>
  guildConfigContract.parse({
    guilds: [],
    ...props,
  });
