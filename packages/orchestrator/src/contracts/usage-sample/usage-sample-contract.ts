/**
 * PURPOSE: One assistant message's token spend, already placed in the hour it happened. Reach for
 *   this as the output of parsing a transcript line, rather than a bare UsageBucket: the bucket
 *   says HOW MUCH, and the guardrail only ever asks how much was spent WITHIN a window, so the
 *   timestamp has to survive the parse or the line cannot be attributed.
 *
 * USAGE:
 * usageSampleContract.parse({ bucketStartMs: 1789272000000, tokens: bucket });
 * // Returns: UsageSample
 */

import { z } from 'zod';

import { usageBucketContract } from '@dungeonmaster/shared/contracts';

export const usageSampleContract = z.object({
  // The start of the hour this message landed in, epoch milliseconds.
  bucketStartMs: z.number().int().min(0).brand<'EpochMs'>(),
  tokens: usageBucketContract,
});

export type UsageSample = z.infer<typeof usageSampleContract>;
