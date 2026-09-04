/**
 * PURPOSE: The five token counts one API response reports, kept apart rather than summed. Cache reads
 * and cache writes price differently and a post-mortem that adds them together cannot tell an
 * expensive session from a well-cached one, so no field here is ever collapsed into another.
 *
 * USAGE:
 * tokenUsageContract.parse({
 *   inputTokens: 2, outputTokens: 239, cacheReadTokens: 0,
 *   cacheCreationTokens: 32_335, thinkingTokens: 0,
 * });
 */
import { z } from 'zod';

export const tokenUsageContract = z
  .object({
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    cacheReadTokens: z.number().int().nonnegative(),
    cacheCreationTokens: z.number().int().nonnegative(),
    thinkingTokens: z.number().int().nonnegative(),
  })
  .brand<'TokenUsage'>();

export type TokenUsage = z.infer<typeof tokenUsageContract>;
