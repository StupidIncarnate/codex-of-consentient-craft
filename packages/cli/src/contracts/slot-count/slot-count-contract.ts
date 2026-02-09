/**
 * PURPOSE: Provides slot-count contract from orchestrator
 *
 * USAGE:
 * slotCountContract.parse(3);
 * // Returns: SlotCount branded number
 */

import {
  slotCountContract as orcSlotCountContract,
  type SlotCount as OrcSlotCount,
} from '@dungeonmaster/orchestrator';

export const slotCountContract = orcSlotCountContract;

export type SlotCount = OrcSlotCount;
