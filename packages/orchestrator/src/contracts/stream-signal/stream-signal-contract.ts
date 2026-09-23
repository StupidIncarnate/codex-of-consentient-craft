/**
 * PURPOSE: Defines the structure of a signal extracted from Claude stream-json output
 *
 * USAGE:
 * const signal = streamSignalContract.parse({ signal: 'complete', operationItemId, operationStatus: 'done' });
 * // Returns validated StreamSignal from agent's MCP tool call
 */

import { z } from 'zod';

import { blockedReasonContract, operationItemIdContract } from '@dungeonmaster/shared/contracts';

// Mirrors the shape of a `signal-back` tool_use call AS EMITTED into an agent's own session
// stream — a JSONL transcript already on disk may carry an older call shape, so this parser stays
// more permissive than the live tool's input contract (`signalBackInputContract`, `.strict()`, no
// `operationStatus` key at all). `complete` is the sole signal kind, a session-terminal marker.
// The only other failure concept is a ward exit-code red, classified by whichever ward handler ran
// it — `stepHandlerWardBroker` for a normal quest's deterministic step, `questRunWardBroker` for a
// step-less item.
export const streamSignalContract = z.object({
  signal: z.literal('complete'),
  operationItemId: operationItemIdContract.optional(),
  operationStatus: z.enum(['done', 'partial', 'blocked']).optional(),
  blockedReason: blockedReasonContract.optional(),
});

export type StreamSignal = z.infer<typeof streamSignalContract>;
