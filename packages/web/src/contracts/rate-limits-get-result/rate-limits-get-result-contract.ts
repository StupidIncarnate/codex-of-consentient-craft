/**
 * PURPOSE: Validates the wire body of GET /api/rate-limits. `snapshot` is null until a statusline-tap has
 * run. `fetchJson` resolves `unknown`; this is what the broker parses its response through.
 *
 * USAGE:
 * rateLimitsGetResultContract.parse(body);
 * // Returns { snapshot: RateLimitsSnapshot | null }
 */

import { rateLimitsSnapshotContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const rateLimitsGetResultContract = z.object({
  snapshot: rateLimitsSnapshotContract.nullable(),
});

export type RateLimitsGetResult = z.infer<typeof rateLimitsGetResultContract>;
