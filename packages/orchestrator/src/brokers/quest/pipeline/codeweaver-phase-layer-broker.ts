/**
 * PURPOSE: Runs the codeweaver phase using the slot manager for dependency-aware parallel execution
 *
 * USAGE:
 * await codeweaverPhaseLayerBroker({questId, questFilePath, onPhaseChange});
 * // Executes codeweaver phase with 3 concurrent slots, throws on incomplete steps
 */

import type { FilePath, QuestId } from '@dungeonmaster/shared/contracts';

import type { OrchestrationPhase } from '../../../contracts/orchestration-phase/orchestration-phase-contract';
import { slotCountContract } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { slotCountToSlotOperationsTransformer } from '../../../transformers/slot-count-to-slot-operations/slot-count-to-slot-operations-transformer';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';

const CODEWEAVER_SLOT_COUNT = 3;
const CODEWEAVER_TIMEOUT_MS = 600000;

export const codeweaverPhaseLayerBroker = async ({
  questId: _questId,
  questFilePath,
  onPhaseChange,
  onAgentLine,
}: {
  questId: QuestId;
  questFilePath: FilePath;
  onPhaseChange: (params: { phase: OrchestrationPhase }) => void;
  onAgentLine?: (params: { slotIndex: SlotIndex; line: string }) => void;
}): Promise<void> => {
  onPhaseChange({ phase: 'codeweaver' });

  const slotCount = slotCountContract.parse(CODEWEAVER_SLOT_COUNT);
  const timeoutMs = timeoutMsContract.parse(CODEWEAVER_TIMEOUT_MS);
  const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });

  const result = await slotManagerOrchestrateBroker({
    questFilePath,
    slotCount,
    timeoutMs,
    slotOperations,
    role: 'codeweaver',
    ...(onAgentLine === undefined ? {} : { onAgentLine }),
  });

  if (!result.completed) {
    const stepNames = result.incompleteSteps.map((step) => step.name).join(', ');
    throw new Error(`Codeweaver phase failed: incomplete steps - ${stepNames}`);
  }
};
