/**
 * PURPOSE: Defines the cross-process orchestration dispatch state — whether the Node dispatcher is
 * playing and when the /dumpster-launch MCP loop last polled get-next-step. Persisted at
 * <dungeonmasterHome>/dispatch-state.json so the HTTP server and each MCP stdio child (separate OS
 * processes) share one source of truth.
 *
 * USAGE:
 * dispatchStateContract.parse({ mode: 'paused', updatedAt: '2024-01-15T10:00:00.000Z' });
 * // Returns: DispatchState
 */

import { z } from 'zod';

export const dispatchStateContract = z.object({
  mode: z.enum(['node-playing', 'paused']),
  mcpHeartbeatAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  updatedAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type DispatchState = z.infer<typeof dispatchStateContract>;
