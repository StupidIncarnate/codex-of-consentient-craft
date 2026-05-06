/**
 * PURPOSE: Branded duration in milliseconds passed to rxjs timeout() — the maximum time to wait between emissions before the source stream errors.
 *
 * USAGE:
 * timeoutMsContract.parse(30000);
 * // Returns TimeoutMs: 30000 ms
 */

import { z } from 'zod';

export const timeoutMsContract = z.number().int().positive().brand<'TimeoutMs'>();

export type TimeoutMs = z.infer<typeof timeoutMsContract>;
