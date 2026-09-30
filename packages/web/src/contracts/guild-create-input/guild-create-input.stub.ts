/**
 * PURPOSE: Builds a valid GuildCreateInput for tests, defaulting to an absolute Unix path.
 *
 * USAGE:
 * GuildCreateInputStub();
 * // Returns { path: GuildCreateInputPath }
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';

import { guildCreateInputContract } from './guild-create-input-contract';
import type { GuildCreateInput } from './guild-create-input-contract';

export const GuildCreateInputStub = ({
  ...props
}: StubArgument<GuildCreateInput> = {}): GuildCreateInput =>
  guildCreateInputContract.parse({
    path: '/home/user/my-guild',
    ...props,
  });
