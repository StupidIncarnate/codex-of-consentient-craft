import type { StubArgument } from '@dungeonmaster/shared/@types';
import { GuildIdStub } from '@dungeonmaster/shared/contracts';
import { guildIdBodyContract } from './guild-id-body-contract';
import type { GuildIdBody } from './guild-id-body-contract';

export const GuildIdBodyStub = ({ ...props }: StubArgument<GuildIdBody> = {}): GuildIdBody =>
  guildIdBodyContract.parse({
    guildId: GuildIdStub(),
    ...props,
  });
