/**
 * PURPOSE: Defines the interface for slot management operations used by orchestration
 *
 * USAGE:
 * const slotOps: SlotOperations = {getAvailableSlot, assignSlot, releaseSlot, getActiveSlots};
 * // Provides dependency injection interface for slot state management
 */

import { z } from 'zod';

import { agentSlotContract } from '../agent-slot/agent-slot-contract';
import { slotCountContract } from '../slot-count/slot-count-contract';
import { slotIndexContract } from '../slot-index/slot-index-contract';

export const slotOperationsContract = z.object({
  getAvailableSlot: z
    .function()
    .args(z.object({ slotCount: slotCountContract }))
    .returns(slotIndexContract.optional()),
  assignSlot: z
    .function()
    .args(z.object({ slotIndex: slotIndexContract, agentSlot: agentSlotContract }))
    .returns(z.void()),
  releaseSlot: z
    .function()
    .args(z.object({ slotIndex: slotIndexContract }))
    .returns(z.boolean()),
  getActiveSlots: z
    .function()
    .args()
    .returns(z.array(z.object({ slotIndex: slotIndexContract, agentSlot: agentSlotContract }))),
});

export type SlotOperations = z.infer<typeof slotOperationsContract>;
