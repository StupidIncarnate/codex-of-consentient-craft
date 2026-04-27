/**
 * PURPOSE: Defines the payload shape carried by chat-output WebSocket messages consumed by the web client. The orchestrator stamps questId + workItemId on every emit, so both are required on the wire.
 *
 * USAGE:
 * chatOutputPayloadContract.parse({chatProcessId: 'proc-1' as ProcessId, entries: [], questId: '...' as QuestId, workItemId: '...' as QuestWorkItemId});
 * // Returns ChatOutputPayload with required questId + workItemId, optional sessionId, chatProcessId, and slotIndex.
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
  questId: questIdContract,
  workItemId: questWorkItemIdContract,
  slotIndex: z.unknown().optional(),
});

export type ChatOutputPayload = z.infer<typeof chatOutputPayloadContract>;
