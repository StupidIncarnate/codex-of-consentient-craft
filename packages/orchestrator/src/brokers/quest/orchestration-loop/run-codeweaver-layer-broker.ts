/**
 * PURPOSE: Executes the codeweaver phase within the orchestration loop using slot manager for parallel execution
 *
 * USAGE:
 * await runCodeweaverLayerBroker({questId, questFilePath, startPath});
 * // Runs codeweaver agents with 3 concurrent slots, throws on incomplete steps
 */

import type { FilePath, QuestId } from '@dungeonmaster/shared/contracts';

import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import { slotCountContract } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { slotCountToSlotOperationsTransformer } from '../../../transformers/slot-count-to-slot-operations/slot-count-to-slot-operations-transformer';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';

const CODEWEAVER_SLOT_COUNT = 3;
const CODEWEAVER_TIMEOUT_MS = 600000;

export const runCodeweaverLayerBroker = async ({
  questFilePath,
  startPath,
  onAgentEntry,
}: {
  questId: QuestId;
  questFilePath: FilePath;
  startPath: FilePath;
  onAgentEntry?: (params: { slotIndex: SlotIndex; entry: ChatLineEntry['entry'] }) => void;
}): Promise<void> => {
  const slotCount = slotCountContract.parse(CODEWEAVER_SLOT_COUNT);
  const timeoutMs = timeoutMsContract.parse(CODEWEAVER_TIMEOUT_MS);
  const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });

  const result = await slotManagerOrchestrateBroker({
    questFilePath,
    slotCount,
    timeoutMs,
    slotOperations,
    role: 'codeweaver',
    startPath,
    ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
  });

  if (!result.completed) {
    const stepNames = result.incompleteSteps.map((step) => step.name).join(', ');
    throw new Error(`Codeweaver phase failed: incomplete steps - ${stepNames}`);
  }
};
