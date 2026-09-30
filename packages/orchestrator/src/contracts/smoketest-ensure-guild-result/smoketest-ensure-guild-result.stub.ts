/**
 * PURPOSE: Builds a valid SmoketestEnsureGuildResult for tests
 *
 * USAGE:
 * SmoketestEnsureGuildResultStub();
 * // Returns a valid SmoketestEnsureGuildResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';

import { smoketestEnsureGuildResultContract } from './smoketest-ensure-guild-result-contract';
import type { SmoketestEnsureGuildResult } from './smoketest-ensure-guild-result-contract';

export const SmoketestEnsureGuildResultStub = ({
  ...props
}: StubArgument<SmoketestEnsureGuildResult> = {}): SmoketestEnsureGuildResult =>
  smoketestEnsureGuildResultContract.parse({ guildId: GuildStub().id, ...props });
