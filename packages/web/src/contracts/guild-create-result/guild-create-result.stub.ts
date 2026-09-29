/**
 * PURPOSE: Builds a valid GuildCreateResult for tests, defaulting to a valid GuildId shape a
 * guild-create broker returns after a 2xx response.
 *
 * USAGE:
 * GuildCreateResultStub();
 * // Returns { id: GuildId }
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';

import { guildCreateResultContract } from './guild-create-result-contract';
import type { GuildCreateResult } from './guild-create-result-contract';

export const GuildCreateResultStub = ({
  ...props
}: StubArgument<GuildCreateResult> = {}): GuildCreateResult =>
  guildCreateResultContract.parse({
    id: GuildIdStub(),
    ...props,
  });
