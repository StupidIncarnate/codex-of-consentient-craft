/**
 * PURPOSE: Defines the data `SmoketestRunResponder` returns
 *
 * USAGE:
 * smoketestRunResultContract.parse(value);
 * // Returns validated SmoketestRunResult
 */
import { z } from '#gateway/npm/zod';
import { activeSmoketestRunContract } from '../active-smoketest-run/active-smoketest-run-contract';
import { questContract, smoketestCaseResultContract } from '@dungeonmaster/shared/contracts';

export const smoketestRunResultContract = z
  .object({
    runId: activeSmoketestRunContract.shape.runId,
    enqueued: z
      .array(
        z
          .object({
            questId: questContract.shape.id,
            guildSlug: z.string().brand<'SmoketestRunResultEnqueuedGuildSlug'>(),
          })
          .brand<'SmoketestRunResultEnqueued'>(),
      )
      .readonly(),
    results: z.array(smoketestCaseResultContract).readonly(),
  })
  .brand<'SmoketestRunResult'>();

export type SmoketestRunResult = z.infer<typeof smoketestRunResultContract>;
