/**
 * PURPOSE: The five token counts one API response reports, kept apart rather than summed. A cache
 * read reuses a prompt prefix that's already cached, so it is cheap. A cache write
 * (`cacheCreationTokens`) stores a new prefix instead. It costs more than plain input. A
 * post-mortem that adds cache reads and cache writes together cannot tell an expensive session
 * apart from a well-cached one. So no field here is ever collapsed into another.
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
