/**
 * PURPOSE: Defines the payload shape carried by chat-output WebSocket messages consumed by the web client.
 * questId + workItemId are optional to support both live quest emissions (which carry them) and session
 * replay emissions (which carry chatProcessId only and do not carry questId/workItemId).
 *
 * USAGE:
 * chatOutputPayloadContract.parse({chatProcessId: 'proc-1' as ProcessId, entries: [], questId: '...' as QuestId, workItemId: '...' as QuestWorkItemId});
 * // Returns ChatOutputPayload with optional questId + workItemId, optional sessionId, chatProcessId, and slotIndex.
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
