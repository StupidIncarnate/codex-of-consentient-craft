/**
 * PURPOSE: Defines a branded non-negative integer type for agent slot indices
 *
 * USAGE:
 * slotIndexContract.parse(0);
 * // Returns: SlotIndex branded number
 */

import { slotIndexContract as orcSlotIndexContract } from '@dungeonmaster/orchestrator';
import type { SlotIndex as OrcSlotIndex } from '@dungeonmaster/orchestrator';

export const slotIndexContract = orcSlotIndexContract;

export type SlotIndex = OrcSlotIndex;
