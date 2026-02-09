/**
 * PURPOSE: Provides slot-data contract from orchestrator
 *
 * USAGE:
 * slotDataContract.parse({stepId, sessionId, startedAt});
 * // Returns: SlotData object
 */

import {
  slotDataContract as orcSlotDataContract,
  type SlotData as OrcSlotData,
} from '@dungeonmaster/orchestrator';

export const slotDataContract = orcSlotDataContract;

export type SlotData = OrcSlotData;
