import type { StubArgument } from '../../@types/stub-argument.type';

import { guildConfigContract } from './guild-config-contract';
import type { GuildConfig } from './guild-config-contract';

export const GuildConfigStub = ({ ...props }: StubArgument<GuildConfig> = {}): GuildConfig =>
  guildConfigContract.parse({
    guilds: [],
    ...props,
  });
