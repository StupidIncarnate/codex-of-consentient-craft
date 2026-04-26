/**
 * PURPOSE: Defines the payload shape carried by chat-output WebSocket messages consumed by the web client
 *
 * USAGE:
 * chatOutputPayloadContract.parse({chatProcessId: 'proc-1' as ProcessId, entries: []});
 * // Returns ChatOutputPayload with optional sessionId and slotIndex
 */

import { z } from 'zod';

import { processIdContract, sessionIdContract } from '@dungeonmaster/shared/contracts';

export const chatOutputPayloadContract = z.object({
  chatProcessId: processIdContract.optional(),
  entries: z.unknown(),
  sessionId: sessionIdContract.optional(),
  slotIndex: z.unknown().optional(),
});

export type ChatOutputPayload = z.infer<typeof chatOutputPayloadContract>;
