/**
 * PURPOSE: Runs lawbringer agents to review code quality via slot manager
 *
 * USAGE:
 * await lawbringerPhaseLayerBroker({
 *   questFilePath: FilePathStub({ value: '/quests/quest.json' }),
 *   startPath: FilePathStub({ value: '/project/src' }),
 *   slotCount: SlotCountStub(),
 *   slotOperations: SlotOperationsStub(),
 *   onPhaseChange: ({ phase }) => {},
 * });
 * // Returns void after lawbringer slot manager orchestration completes
 */

import type { FilePath } from '@dungeonmaster/shared/contracts';

import type { OrchestrationPhase } from '../../../contracts/orchestration-phase/orchestration-phase-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { buildWorkUnitForRoleTransformer } from '../../../transformers/build-work-unit-for-role/build-work-unit-for-role-transformer';
import { workUnitsToWorkTrackerTransformer } from '../../../transformers/work-units-to-work-tracker/work-units-to-work-tracker-transformer';
import { questLoadBroker } from '../load/quest-load-broker';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';

const LAWBRINGER_TIMEOUT_MS = 300000;

export const lawbringerPhaseLayerBroker = async ({
  questFilePath,
  startPath,
  slotCount,
  slotOperations,
  onPhaseChange,
  abortSignal,
}: {
  questFilePath: FilePath;
  startPath: FilePath;
  slotCount: SlotCount;
  slotOperations: SlotOperations;
  onPhaseChange: (params: { phase: OrchestrationPhase }) => void;
  abortSignal?: AbortSignal;
}): Promise<void> => {
  if (abortSignal?.aborted) {
    return;
  }

  onPhaseChange({ phase: 'lawbringer' });

  const timeoutMs = timeoutMsContract.parse(LAWBRINGER_TIMEOUT_MS);

  const quest = await questLoadBroker({ questFilePath });
  const stepsToReview = quest.steps.filter((step) => step.status !== 'complete');
  const workUnits = stepsToReview.map((step) =>
    buildWorkUnitForRoleTransformer({ role: 'lawbringer', step, quest }),
  );
  const workTracker = workUnitsToWorkTrackerTransformer({ workUnits });

  await slotManagerOrchestrateBroker({
    workTracker,
    slotCount,
    timeoutMs,
    slotOperations,
    startPath,
    ...(abortSignal === undefined ? {} : { abortSignal }),
  });
};
