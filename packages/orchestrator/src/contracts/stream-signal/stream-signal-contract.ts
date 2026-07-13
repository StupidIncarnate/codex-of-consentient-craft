/**
 * PURPOSE: Defines the structure of a signal extracted from Claude stream-json output
 *
 * USAGE:
 * const signal = streamSignalContract.parse({ signal: 'complete', operationItemId, operationStatus: 'done' });
 * // Returns validated StreamSignal from agent's MCP tool call
 */

import { z } from 'zod';

import { operationItemIdContract } from '@dungeonmaster/shared/contracts';

// Mirror of MCP's signalBackInputContract for local validation. `complete` is the sole signal
// kind (session-terminal marker); the outcome rides on the call as operationStatus. The handler
// applies it server-side: 'done' → the linked operation item completes and dispatch advances;
// 'partial' → the item completes AND a "pt N" continuation is appended for a fresh session.
// There is no failure signal — agents fix their own problems and move forward; the only failure
// concept is a ward exit-code red, handled inside quest-run-ward-broker.
export const streamSignalContract = z.object({
  signal: z.literal('complete'),
  operationItemId: operationItemIdContract.optional(),
  operationStatus: z.enum(['done', 'partial']).optional(),
});

export type StreamSignal = z.infer<typeof streamSignalContract>;
