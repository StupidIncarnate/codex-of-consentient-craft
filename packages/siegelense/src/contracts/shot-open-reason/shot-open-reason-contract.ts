/**
 * PURPOSE: Why one shot in a run's `shots` list is flagged `open: true` for a session to actually
 * view — `start`, `end` or `failed` — never `pixelChange` or `blank`, which `shotListingContract`
 * deliberately omits rather than ships empty (chunk-02-driver-and-batch.md §2). Reach for this over
 * RunStatus: RunStatus is ONE verdict for the whole run; ShotOpenReason explains ONE shot's own
 * inclusion, and a single `failed` run can still carry a `start` shot that opened for context
 * alongside the `failed` one.
 *
 * USAGE:
 * shotOpenReasonContract.parse('failed');
 * // Returns a branded ShotOpenReason
 */

import { z } from 'zod';

export const shotOpenReasonContract = z.enum(['start', 'end', 'failed']).brand<'ShotOpenReason'>();

export type ShotOpenReason = z.infer<typeof shotOpenReasonContract>;
