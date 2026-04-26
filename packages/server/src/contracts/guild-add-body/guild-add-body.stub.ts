import type { StubArgument } from '@dungeonmaster/shared/@types';
import { guildAddBodyContract } from './guild-add-body-contract';
import type { GuildAddBody } from './guild-add-body-contract';

export const GuildAddBodyStub = ({ ...props }: StubArgument<GuildAddBody> = {}): GuildAddBody =>
  guildAddBodyContract.parse({
    name: 'My Guild',
    path: '/projects/test',
    ...props,
  });
