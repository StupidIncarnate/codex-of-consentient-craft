/**
 * PURPOSE: Latest rate-limit snapshot persisted by statusline-tap and broadcast over WebSocket to the web UI
 *
 * USAGE:
 * rateLimitsSnapshotContract.parse({fiveHour: window, sevenDay: window, updatedAt: iso});
 * // Returns: RateLimitsSnapshot — null windows mean "no data yet" (graceful UI hide)
 */
import { z } from 'zod';

import { rateLimitWindowContract } from '../rate-limit-window/rate-limit-window-contract';

export const rateLimitsSnapshotContract = z.object({
  fiveHour: rateLimitWindowContract.nullable(),
  sevenDay: rateLimitWindowContract.nullable(),
  updatedAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type RateLimitsSnapshot = z.infer<typeof rateLimitsSnapshotContract>;
