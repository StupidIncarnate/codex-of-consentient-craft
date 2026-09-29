/**
 * PURPOSE: Defines the orchestration dispatch state — whether the Node dispatcher is playing, and
 * whether the rate-limit guardrail is currently vetoing dispatch. Persisted at
 * <dungeonmasterHome>/dispatch-state.json so the mode survives inside one dungeonmaster home and the
 * HTTP server can normalize it to `paused` on boot.
 *
 * `mode` and `hold` are INDEPENDENT, and that separation is load-bearing: `mode` is the user's
 * lever, `hold` is the guardrail's. Folding a rate-limit stop into `mode: 'paused'` would let an
 * auto-resume restart a queue the user deliberately stopped, and would let the user press play
 * straight back into a spent quota. Dispatch runs only when the mode is `node-playing` AND no hold
 * is live.
 *
 * USAGE:
 * dispatchStateContract.parse({ mode: 'paused', updatedAt: '2024-01-15T10:00:00.000Z' });
 * // Returns: DispatchState
 */

import { z } from '#gateway/npm/zod';

import { dispatchHoldContract } from '../dispatch-hold/dispatch-hold-contract';

export const dispatchStateContract = z.object({
  mode: z.enum(['node-playing', 'paused']),
  // `.nullish()`, not `.optional()` — clearing an expired hold writes an explicit null through the
  // same persist path that wrote it, and `.optional()` alone rejects that.
  hold: dispatchHoldContract.nullish(),
  updatedAt: z.iso.datetime().brand<'IsoTimestamp'>(),
});

export type DispatchState = z.infer<typeof dispatchStateContract>;
