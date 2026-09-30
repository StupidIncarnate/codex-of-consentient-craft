/**
 * PURPOSE: Defines the shape orchestration-loop responders construct for chat-output orchestration events emitted on the in-memory event bus. Carries questId+workItemId so the server can route per-quest broadcasts to the right subscribed clients.
 *
 * USAGE:
 * chatOutputEmitPayloadContract.parse({ processId, slotIndex, entries, questId, workItemId, sessionId, chatProcessId });
 * // Returns: { processId, slotIndex, entries, questId, workItemId, sessionId?, chatProcessId? }
 */

import { z } from '#gateway/npm/zod';

import { chatEntryContract, processIdContract, questWorkItemIdContract, sessionIdContract, slotIndexContract, questContract } from '@dungeonmaster/shared/contracts';


export const chatOutputEmitPayloadContract = z.object({
  processId: processIdContract,
  slotIndex: slotIndexContract,
  entries: z.array(chatEntryContract),
  questId: questContract.shape.id,
  workItemId: questWorkItemIdContract,
  sessionId: sessionIdContract.optional(),
  chatProcessId: processIdContract.optional(),
});

export type ChatOutputEmitPayload = z.infer<typeof chatOutputEmitPayloadContract>;
