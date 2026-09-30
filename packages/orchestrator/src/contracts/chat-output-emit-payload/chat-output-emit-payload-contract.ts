/**
 * PURPOSE: Defines the shape orchestration-loop responders construct for chat-output orchestration events emitted on the in-memory event bus. Carries questId+workItemId so the server can route per-quest broadcasts to the right subscribed clients.
 *
 * USAGE:
 * chatOutputEmitPayloadContract.parse({ processId, slotIndex, entries, questId, workItemId, sessionId, chatProcessId });
 * // Returns: { processId, slotIndex, entries, questId, workItemId, sessionId?, chatProcessId? }
 */

import { z } from '#gateway/npm/zod';

import {
  chatEntryContract,
  questContract,
  workItemContract,
  sessionContract,
} from '@dungeonmaster/shared/contracts';

export const chatOutputEmitPayloadContract = z
  .object({
    processId: z.string().min(1).brand<'ChatOutputEmitPayloadProcessId'>(),
    slotIndex: z.number().int().nonnegative().brand<'ChatOutputEmitPayloadSlotIndex'>(),
    entries: z.array(chatEntryContract),
    questId: questContract.shape.id,
    workItemId: workItemContract.shape.id,
    sessionId: sessionContract.shape.id.optional(),
    chatProcessId: z.string().min(1).brand<'ChatOutputEmitPayloadChatProcessId'>().optional(),
  })
  .brand<'ChatOutputEmitPayload'>();

export type ChatOutputEmitPayload = z.infer<typeof chatOutputEmitPayloadContract>;
