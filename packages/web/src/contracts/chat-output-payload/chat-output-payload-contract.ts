/**
 * PURPOSE: Defines the payload shape carried by chat-output WebSocket messages consumed by the web client
 *
 * USAGE:
 * chatOutputPayloadContract.parse({chatProcessId: 'proc-1' as ProcessId, entries: []});
 * // Returns ChatOutputPayload with optional sessionId, questId, workItemId, and slotIndex
 */

import { z } from 'zod';

import {
  processIdContract,
  questIdContract,
  questWorkItemIdContract,
  sessionIdContract,
} from '@dungeonmaster/shared/contracts';

export const chatOutputPayloadContract = z.object({
  chatProcessId: processIdContract.optional(),
  entries: z.unknown(),
  sessionId: sessionIdContract.optional(),
  questId: questIdContract.optional(),
  workItemId: questWorkItemIdContract.optional(),
  slotIndex: z.unknown().optional(),
});

export type ChatOutputPayload = z.infer<typeof chatOutputPayloadContract>;
