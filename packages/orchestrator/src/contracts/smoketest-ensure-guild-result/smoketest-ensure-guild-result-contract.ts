/**
 * PURPOSE: Defines the data `smoketestEnsureGuildBroker` returns
 *
 * USAGE:
 * smoketestEnsureGuildResultContract.parse(value);
 * // Returns validated SmoketestEnsureGuildResult
 */
import { z } from '#gateway/npm/zod';
import { guildContract } from '@dungeonmaster/shared/contracts';

export const smoketestEnsureGuildResultContract = z
  .object({ guildId: guildContract.shape.id })
  .brand<'SmoketestEnsureGuildResult'>();

export type SmoketestEnsureGuildResult = z.infer<typeof smoketestEnsureGuildResultContract>;
