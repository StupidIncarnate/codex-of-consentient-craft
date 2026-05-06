/**
 * PURPOSE: Defines a single rate-limit window (5-hour or 7-day) with current usage and reset time
 *
 * USAGE:
 * rateLimitWindowContract.parse({usedPercentage: 42, resetsAt: '2026-05-05T15:00:00.000Z'});
 * // Returns: RateLimitWindow object — used by rate-limits-snapshot and rate-limits-history-line
 */
import { z } from 'zod';

import { rateLimitStatics } from '../../statics/rate-limit/rate-limit-statics';

export const rateLimitWindowContract = z.object({
  usedPercentage: z
    .number()
    .min(rateLimitStatics.percent.min)
    .max(rateLimitStatics.percent.max)
    .brand<'RateLimitUsedPercentage'>(),
  resetsAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type RateLimitWindow = z.infer<typeof rateLimitWindowContract>;
