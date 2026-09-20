/**
 * PURPOSE: A millisecond Unix epoch, never an ISO timestamp, because staleness is arithmetic — a
 * heartbeat is stale when `now - beatAtMs` passes a threshold, and an ISO string cannot be
 * subtracted without a parse on every read. `status` formats an EpochMs to a display string only at
 * the edge; nothing upstream of that should ever hold the string form.
 *
 * USAGE:
 * epochMsContract.parse(Date.now());
 * // Returns a branded EpochMs
 */

import { z } from 'zod';

export const epochMsContract = z.number().int().nonnegative().brand<'EpochMs'>();

export type EpochMs = z.infer<typeof epochMsContract>;
