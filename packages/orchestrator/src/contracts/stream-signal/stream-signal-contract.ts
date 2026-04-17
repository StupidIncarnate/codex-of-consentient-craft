/**
 * PURPOSE: Defines the structure of a signal extracted from Claude stream-json output
 *
 * USAGE:
 * const signal = streamSignalContract.parse({ signal: 'complete', summary: '...' });
 * // Returns validated StreamSignal from agent's MCP tool call
 */

import { z } from 'zod';

// Mirror of MCP's signalBackInputContract for local validation
// Agents signal complete, failed, or failed-replan. The orchestrator owns failure routing
// (which role to spawn next) via a static role map — agents don't choose.
// failed-replan is emitted by blightwarden when semantic findings require PathSeeker to add
// new steps before retry; the run-blightwarden-layer-broker drains+skips pending items and
// spawns a PathSeeker replan (handle-signal-layer-broker only maps signal: failed).
export const streamSignalContract = z.object({
  signal: z.enum(['complete', 'failed', 'failed-replan']),
  summary: z.string().min(1).brand<'SignalSummary'>().optional(),
});

export type StreamSignal = z.infer<typeof streamSignalContract>;
