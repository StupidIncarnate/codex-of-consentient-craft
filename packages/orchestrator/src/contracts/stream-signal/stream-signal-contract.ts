/**
 * PURPOSE: Defines the structure of a signal extracted from Claude stream-json output
 *
 * USAGE:
 * const signal = streamSignalContract.parse({ signal: 'complete', summary: '...' });
 * // Returns validated StreamSignal from agent's MCP tool call
 */

import { z } from 'zod';

// Mirror of MCP's signalBackInputContract for local validation. Agents signal complete, failed, or
// failed-replan; the orchestrator owns recovery-first failure routing (quest-handle-signal-back-
// responder) — agents don't choose. `failed` is a code failure (→ spiritmender fix + re-run the
// role); `failed-replan` is a plan hole (→ PathSeeker replan). Neither blocks the quest — only
// PathSeeker does, when its replan/retry loop is spent.
export const streamSignalContract = z.object({
  signal: z.enum(['complete', 'failed', 'failed-replan']),
  summary: z.string().min(1).brand<'SignalSummary'>().optional(),
});

export type StreamSignal = z.infer<typeof streamSignalContract>;
