import type { StubArgument } from '@dungeonmaster/shared/@types';
import { linkSpecContract } from './link-spec-contract';
import type { LinkSpec } from './link-spec-contract';

export const LinkSpecStub = ({ ...props }: StubArgument<LinkSpec> = {}): LinkSpec =>
  linkSpecContract.parse({
    of: 'guild',
    as: 'guildId',
    ...props,
  });
