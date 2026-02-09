/**
 * PURPOSE: Defines the structure for tracking a running orchestration process
 *
 * USAGE:
 * orchestrationProcessContract.parse({processId, questId, process, phase, ...});
 * // Returns: OrchestrationProcess object for tracking quest execution
 */

import { z } from 'zod';

import { processIdContract, questIdContract } from '@dungeonmaster/shared/contracts';

import { completedCountContract } from '../completed-count/completed-count-contract';
import { isoTimestampContract } from '../iso-timestamp/iso-timestamp-contract';
import { killableProcessContract } from '../killable-process/killable-process-contract';
import { orchestrationPhaseContract } from '../orchestration-phase/orchestration-phase-contract';
import { orchestrationSlotDataContract } from '../orchestration-slot-data/orchestration-slot-data-contract';
import { stepNameContract } from '../step-name/step-name-contract';
import { totalCountContract } from '../total-count/total-count-contract';

export const orchestrationProcessContract = z.object({
  processId: processIdContract,
  questId: questIdContract,
  process: killableProcessContract,
  phase: orchestrationPhaseContract,
  completedSteps: completedCountContract,
  totalSteps: totalCountContract,
  currentStep: stepNameContract.optional(),
  startedAt: isoTimestampContract,
  slots: z.array(orchestrationSlotDataContract),
});

export type OrchestrationProcess = z.infer<typeof orchestrationProcessContract>;
