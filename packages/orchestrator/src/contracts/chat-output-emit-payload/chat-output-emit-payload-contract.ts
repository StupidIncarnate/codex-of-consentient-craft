/**
 * PURPOSE: Defines the shape orchestration-loop responders construct for chat-output orchestration events emitted on the in-memory event bus. Carries questId+workItemId so the server can route per-quest broadcasts to the right subscribed clients.
 *
 * USAGE:
 * chatOutputEmitPayloadContract.parse({ processId, slotIndex, entries, questId, workItemId, sessionId, chatProcessId });
 * // Returns: { processId, slotIndex, entries, questId, workItemId, sessionId?, chatProcessId? }
 */

import { z } from 'zod';

import {
  chatEntryContract,
  processIdContract,
  questIdContract,
  questWorkItemIdContract,
  sessionIdContract,
} from '@dungeonmaster/shared/contracts';

import { slotIndexContract } from '../slot-index/slot-index-contract';

export const chatOutputEmitPayloadContract = z.object({
  processId: processIdContract,
  slotIndex: slotIndexContract,
  entries: z.array(chatEntryContract),
  questId: questIdContract,
  workItemId: questWorkItemIdContract,
  sessionId: sessionIdContract.optional(),
  chatProcessId: processIdContract.optional(),
});

export type ChatOutputEmitPayload = z.infer<typeof chatOutputEmitPayloadContract>;
