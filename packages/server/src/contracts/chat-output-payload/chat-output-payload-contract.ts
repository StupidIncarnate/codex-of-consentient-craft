/**
 * PURPOSE: Defines the optional fields the server inspects on chat-output orchestration event payloads
 *
 * USAGE:
 * const parsed = chatOutputPayloadContract.parse(payload);
 * // Returns: { slotIndex?: number, questId?: QuestId, workItemId?: QuestWorkItemId, chatProcessId?: ProcessId }
 */

import { z } from 'zod';
import {
  processIdContract,
  questIdContract,
  questWorkItemIdContract,
} from '@dungeonmaster/shared/contracts';

export const chatOutputPayloadContract = z
  .object({
    slotIndex: z.number().int().nonnegative().brand<'SlotIndexField'>().optional(),
    questId: questIdContract.optional(),
    workItemId: questWorkItemIdContract.optional(),
    chatProcessId: processIdContract.optional(),
  })
  .passthrough();

export type ChatOutputPayload = z.infer<typeof chatOutputPayloadContract>;
