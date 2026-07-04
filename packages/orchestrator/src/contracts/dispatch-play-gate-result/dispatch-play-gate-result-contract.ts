/**
 * PURPOSE: Result of the Node-dispatcher play gate — whether playing is allowed, and the
 * human-readable refusal reason when a /dumpster-launch loop still owns the queue.
 *
 * USAGE:
 * dispatchPlayGateResultContract.parse({ allowed: false, reason: 'A /dumpster-launch loop ...' });
 * // Returns: DispatchPlayGateResult
 */

import { z } from 'zod';

export const dispatchPlayGateResultContract = z.object({
  allowed: z.boolean(),
  reason: z.string().min(1).brand<'DispatchPlayRefusalReason'>().optional(),
});

export type DispatchPlayGateResult = z.infer<typeof dispatchPlayGateResultContract>;
