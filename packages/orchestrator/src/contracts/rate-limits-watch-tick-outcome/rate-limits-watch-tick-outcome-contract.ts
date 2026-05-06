/**
 * PURPOSE: Discriminator for what happened during one rate-limits poll tick — used by the watch broker to avoid Promise<void>
 *
 * USAGE:
 * rateLimitsWatchTickOutcomeContract.parse('changed');
 * // 'changed' = file content differs from last seen, snapshot emitted
 * // 'unchanged' = file content matches last seen, no emit
 * // 'cleared' = file vanished (ENOENT), snapshot=null emitted once
 * // 'error' = read or parse failed, error reported via onError
 */
import { z } from 'zod';

export const rateLimitsWatchTickOutcomeContract = z.enum([
  'changed',
  'unchanged',
  'cleared',
  'error',
]);

export type RateLimitsWatchTickOutcome = z.infer<typeof rateLimitsWatchTickOutcomeContract>;
