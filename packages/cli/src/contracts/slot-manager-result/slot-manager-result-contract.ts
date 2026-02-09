/**
 * PURPOSE: Provides slot-manager-result contract from orchestrator
 *
 * USAGE:
 * slotManagerResultContract.parse({completed: true});
 * // Returns: SlotManagerResult object
 */

import {
  slotManagerResultContract as orcSlotManagerResultContract,
  type SlotManagerResult as OrcSlotManagerResult,
} from '@dungeonmaster/orchestrator';

export const slotManagerResultContract = orcSlotManagerResultContract;

export type SlotManagerResult = OrcSlotManagerResult;
