/**
 * PURPOSE: Defines the cross-process orchestration dispatch state — whether the Node dispatcher is
 * playing, when the /dumpster-launch MCP loop last polled get-next-step, and whether the rate-limit
 * guardrail is currently vetoing dispatch. Persisted at <dungeonmasterHome>/dispatch-state.json so
 * the HTTP server and each MCP stdio child (separate OS processes) share one source of truth.
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

import { z } from 'zod';

import { dispatchHoldContract } from '../dispatch-hold/dispatch-hold-contract';

export const dispatchStateContract = z.object({
  mode: z.enum(['node-playing', 'paused']),
  mcpHeartbeatAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  // `.nullish()`, not `.optional()` — clearing an expired hold writes an explicit null through the
  // same persist path that wrote it, and `.optional()` alone rejects that.
  hold: dispatchHoldContract.nullish(),
  updatedAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type DispatchState = z.infer<typeof dispatchStateContract>;
