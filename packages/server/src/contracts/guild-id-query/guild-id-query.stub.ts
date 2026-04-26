import type { StubArgument } from '@dungeonmaster/shared/@types';
import { GuildIdStub } from '@dungeonmaster/shared/contracts';
import { guildIdQueryContract } from './guild-id-query-contract';
import type { GuildIdQuery } from './guild-id-query-contract';

export const GuildIdQueryStub = ({ ...props }: StubArgument<GuildIdQuery> = {}): GuildIdQuery =>
  guildIdQueryContract.parse({
    guildId: GuildIdStub(),
    ...props,
  });
