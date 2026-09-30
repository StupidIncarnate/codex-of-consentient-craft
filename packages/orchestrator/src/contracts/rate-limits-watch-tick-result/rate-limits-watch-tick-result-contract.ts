/**
 * PURPOSE: Result shape returned by one rate-limits poll tick — outcome plus the new lastJson value to thread to the next tick
 *
 * USAGE:
 * rateLimitsWatchTickResultContract.parse({ outcome: 'changed', lastJson: '{"...":...}' });
 * // Used by rateLimitsWatchTickLayerBroker to communicate state forward without mutation
 */
import { z } from '#gateway/npm/zod';


import { rateLimitsWatchTickOutcomeContract } from '../rate-limits-watch-tick-outcome/rate-limits-watch-tick-outcome-contract';

export const rateLimitsWatchTickResultContract = z.object({
  outcome: rateLimitsWatchTickOutcomeContract,
  lastJson: z.string().brand<'RateLimitsWatchTickResultLastJson'>().nullable(),
});

export type RateLimitsWatchTickResult = z.infer<typeof rateLimitsWatchTickResultContract>;
