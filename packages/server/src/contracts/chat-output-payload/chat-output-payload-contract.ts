/**
 * PURPOSE: Defines the optional fields the server inspects on chat-output orchestration event payloads
 *
 * USAGE:
 * const parsed = chatOutputPayloadContract.parse(payload);
 * // Returns: { slotIndex?: number, questId?: QuestId, workItemId?: QuestWorkItemId, chatProcessId?: ProcessId }
 */

import { z } from '#gateway/npm/zod';
import { processIdContract, questWorkItemIdContract, questContract } from '@dungeonmaster/shared/contracts';

export const chatOutputPayloadContract = z
  .object({
    slotIndex: z.number().int().nonnegative().brand<'SlotIndexField'>().optional(),
    questId: questContract.shape.id.optional(),
    workItemId: questWorkItemIdContract.optional(),
    chatProcessId: processIdContract.optional(),
  })
  .loose();

export type ChatOutputPayload = z.infer<typeof chatOutputPayloadContract>;
