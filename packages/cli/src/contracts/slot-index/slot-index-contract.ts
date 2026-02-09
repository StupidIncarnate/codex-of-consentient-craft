/**
 * PURPOSE: Provides slot-index contract from orchestrator
 *
 * USAGE:
 * slotIndexContract.parse(0);
 * // Returns: SlotIndex branded number
 */

import {
  slotIndexContract as orcSlotIndexContract,
  type SlotIndex as OrcSlotIndex,
} from '@dungeonmaster/orchestrator';

export const slotIndexContract = orcSlotIndexContract;

export type SlotIndex = OrcSlotIndex;
