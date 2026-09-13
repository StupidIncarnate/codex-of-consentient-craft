/**
 * PURPOSE: The four token counts every assistant message reports, summed over one hour of wall
 *   clock. Reach for this over rateLimitWindowContract, which carries a percentage Anthropic
 *   computed: this is the raw spend dungeonmaster measured itself, kept unweighted so the weights
 *   can be re-tuned later without rescanning a week of transcripts.
 *
 * USAGE:
 * usageBucketContract.parse({ input: 120, cacheCreation: 4000, cacheRead: 90000, output: 300 });
 * // Returns: UsageBucket
 */

import { z } from 'zod';

const tokenCountContract = z.number().int().min(0).brand<'TokenCount'>();

export const usageBucketContract = z.object({
  input: tokenCountContract,
  cacheCreation: tokenCountContract,
  cacheRead: tokenCountContract,
  output: tokenCountContract,
});

export type UsageBucket = z.infer<typeof usageBucketContract>;
