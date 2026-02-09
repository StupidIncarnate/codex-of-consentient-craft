/**
 * PURPOSE: Defines the structure for tracking slot data in orchestration processes
 *
 * USAGE:
 * orchestrationSlotDataContract.parse({slotIndex: 0, status: 'running', stepName: 'auth-guard'});
 * // Returns: OrchestrationSlotData object for tracking slot state
 */

import { z } from 'zod';

import { agentRoleContract } from '../agent-role/agent-role-contract';
import { slotIndexContract } from '../slot-index/slot-index-contract';
import { slotStatusContract } from '../slot-status/slot-status-contract';
import { stepNameContract } from '../step-name/step-name-contract';

export const orchestrationSlotDataContract = z.object({
  slotIndex: slotIndexContract,
  stepName: stepNameContract.optional(),
  role: agentRoleContract.optional(),
  status: slotStatusContract,
});

export type OrchestrationSlotData = z.infer<typeof orchestrationSlotDataContract>;
