/**
 * PURPOSE: A session total hides a common pattern: most of the spend usually lands in just one or
 * two windows of time. A digest that only sums the whole session cannot show that pattern. This
 * contract is the shape that makes it visible. Each one is a fixed-width slice of the session's
 * activity, laid end to end with its siblings, so a reader can see where the tokens, tool calls
 * and bytes actually landed as the work went on.
 *
 * USAGE:
 * timeBucketContract.parse({
 *   windowStart: '2025-01-15T10:00:00.000Z', windowEnd: '2025-01-15T10:05:00.000Z',
 *   apiResponseCount: 12, toolCallCount: 8, outputTokens: 4_500, contextInTokens: 120_000,
 *   toolResultBytes: 34_000, topTools: [{ name: 'Read', count: 5 }],
 * });
 */
import { z } from 'zod';

import { isoTimestampContract } from '../iso-timestamp/iso-timestamp-contract';

export const timeBucketContract = z
  .object({
    windowStart: isoTimestampContract,
    windowEnd: isoTimestampContract,
    apiResponseCount: z.number().int().nonnegative(),
    toolCallCount: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    contextInTokens: z.number().int().nonnegative(),
    toolResultBytes: z.number().int().nonnegative(),
    topTools: z
      .array(
        z.object({
          name: z.string(),
          count: z.number().int().nonnegative(),
        }),
      )
      .default([]),
  })
  .brand<'TimeBucket'>();

export type TimeBucket = z.infer<typeof timeBucketContract>;
