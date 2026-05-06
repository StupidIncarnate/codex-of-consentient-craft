/**
 * PURPOSE: One JSONL line in the rate-limits history log written by statusline-tap on each accepted update
 *
 * USAGE:
 * rateLimitsHistoryLineContract.parse({at: iso, fiveHour: window, sevenDay: window});
 * // Returns: RateLimitsHistoryLine — appended to ~/.dungeonmaster/rate-limits-history.jsonl for future trajectory analysis
 */
import { z } from 'zod';

import { rateLimitWindowContract } from '../rate-limit-window/rate-limit-window-contract';

export const rateLimitsHistoryLineContract = z.object({
  at: z.string().datetime().brand<'IsoTimestamp'>(),
  fiveHour: rateLimitWindowContract.nullable(),
  sevenDay: rateLimitWindowContract.nullable(),
});

export type RateLimitsHistoryLine = z.infer<typeof rateLimitsHistoryLineContract>;
