/**
 * PURPOSE: Defines the `data` ToolingSmoketestRunResponder returns on success
 *
 * USAGE:
 * const data = toolingSmoketestRunResponseDataContract.parse(value);
 * // Returns validated ToolingSmoketestRunResponseData
 */

import { z } from '#gateway/npm/zod';
import { questContract, smoketestCaseResultContract } from '@dungeonmaster/shared/contracts';

export const toolingSmoketestRunResponseDataContract = z
  .strictObject({
    runId: z.uuid().brand<'ToolingSmoketestRunResponseDataRunId'>(),
    enqueued: z.array(
      z
        .strictObject({
          questId: questContract.shape.id,
          guildSlug: z.string().brand<'ToolingSmoketestRunResponseDataEnqueuedGuildSlug'>(),
        })
        .brand<'ToolingSmoketestRunResponseDataEnqueued'>(),
    ),
    results: z.array(smoketestCaseResultContract),
  })
  .brand<'ToolingSmoketestRunResponseData'>();

export type ToolingSmoketestRunResponseData = z.infer<
  typeof toolingSmoketestRunResponseDataContract
>;
