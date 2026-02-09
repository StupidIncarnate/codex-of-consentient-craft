/**
 * PURPOSE: Provides slot-operations contract from orchestrator
 *
 * USAGE:
 * slotOperationsContract.parse({getAvailableSlot, assignSlot, releaseSlot, getActiveSlots});
 * // Returns: SlotOperations object
 */

import {
  slotOperationsContract as orcSlotOperationsContract,
  type SlotOperations as OrcSlotOperations,
} from '@dungeonmaster/orchestrator';

export const slotOperationsContract = orcSlotOperationsContract;

export type SlotOperations = OrcSlotOperations;
