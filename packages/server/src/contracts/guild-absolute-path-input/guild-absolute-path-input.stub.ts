import type { StubArgument } from '@dungeonmaster/shared/@types';
import { guildAbsolutePathInputContract } from './guild-absolute-path-input-contract';
import type { GuildAbsolutePathInput } from './guild-absolute-path-input-contract';

export const GuildAbsolutePathInputStub = ({
  ...props
}: StubArgument<GuildAbsolutePathInput> = {}): GuildAbsolutePathInput =>
  guildAbsolutePathInputContract.parse({
    path: '/projects/guild',
    ...props,
  });
