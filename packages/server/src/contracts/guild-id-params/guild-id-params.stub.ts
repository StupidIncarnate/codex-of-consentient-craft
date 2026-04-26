import type { StubArgument } from '@dungeonmaster/shared/@types';
import { GuildIdStub } from '@dungeonmaster/shared/contracts';
import { guildIdParamsContract } from './guild-id-params-contract';
import type { GuildIdParams } from './guild-id-params-contract';

export const GuildIdParamsStub = ({ ...props }: StubArgument<GuildIdParams> = {}): GuildIdParams =>
  guildIdParamsContract.parse({
    guildId: GuildIdStub(),
    ...props,
  });
