/**
 * PURPOSE: Defines the optional fields the server inspects on chat-output orchestration event payloads
 *
 * USAGE:
 * const parsed = chatOutputRoutingContract.parse(payload);
 * // Returns: { slotIndex?: number, questId?: QuestId, workItemId?: QuestWorkItemId, chatProcessId?: ProcessId }
 */

import { z } from '#gateway/npm/zod';
import { orchestrationProcessContract } from '@dungeonmaster/orchestrator/contracts';
import { questContract, workItemContract } from '@dungeonmaster/shared/contracts';

export const chatOutputRoutingContract = z
  .object({
    slotIndex: z.number().int().nonnegative().brand<'ChatOutputRoutingSlotIndex'>().optional(),
    questId: questContract.shape.id.optional(),
    workItemId: workItemContract.shape.id.optional(),
    chatProcessId: orchestrationProcessContract.shape.processId.optional(),
  })
  .loose()
  .brand<'ChatOutputRouting'>();

export type ChatOutputRouting = z.infer<typeof chatOutputRoutingContract>;
