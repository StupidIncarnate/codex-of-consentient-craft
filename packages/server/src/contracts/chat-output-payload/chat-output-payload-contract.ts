/**
 * PURPOSE: Defines the optional fields the server inspects on chat-output orchestration event payloads
 *
 * USAGE:
 * const parsed = chatOutputPayloadContract.parse(payload);
 * // Returns: { slotIndex?: number, questId?: QuestId, workItemId?: QuestWorkItemId, chatProcessId?: ProcessId }
 */

import { z } from '#gateway/npm/zod';
import { questContract, workItemContract } from '@dungeonmaster/shared/contracts';

export const chatOutputPayloadContract = z
  .object({
    slotIndex: z.number().int().nonnegative().brand<'ChatOutputPayloadSlotIndex'>().optional(),
    questId: questContract.shape.id.optional(),
    workItemId: workItemContract.shape.id.optional(),
    chatProcessId: z.string().min(1).brand<'ChatOutputPayloadChatProcessId'>().optional(),
  })
  .loose()
  .brand<'ChatOutputPayload'>();

export type ChatOutputPayload = z.infer<typeof chatOutputPayloadContract>;
