/**
 * PURPOSE: Orchestrates the full quest pipeline: codeweaver -> ward -> siegemaster -> lawbringer
 *
 * USAGE:
 * const controller = new AbortController();
 * await questPipelineBroker({processId, questId, questFilePath, startPath, onPhaseChange, abortSignal: controller.signal});
 * // Runs all phases sequentially, calls onPhaseChange('complete') on success
 * // Calls onPhaseChange('failed') on error and re-throws
 * // Checks abortSignal before each phase to support kill mid-pipeline
 */

import {
  absoluteFilePathContract,
  type FilePath,
  type ProcessId,
  type QuestId,
} from '@dungeonmaster/shared/contracts';

import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import type { OrchestrationPhase } from '../../../contracts/orchestration-phase/orchestration-phase-contract';
import { slotCountContract } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { slotCountToSlotOperationsTransformer } from '../../../transformers/slot-count-to-slot-operations/slot-count-to-slot-operations-transformer';
import { codeweaverPhaseLayerBroker } from './codeweaver-phase-layer-broker';
import { lawbringerPhaseLayerBroker } from './lawbringer-phase-layer-broker';
import { siegemasterPhaseLayerBroker } from './siegemaster-phase-layer-broker';
import { wardPhaseLayerBroker } from './ward-phase-layer-broker';

const SLOT_COUNT = 3;

export const questPipelineBroker = async ({
  processId: _processId,
  questId,
  questFilePath,
  startPath,
  onPhaseChange,
  onAgentEntry,
  abortSignal,
}: {
  processId: ProcessId;
  questId: QuestId;
  questFilePath: FilePath;
  startPath: FilePath;
  onPhaseChange: (params: { phase: OrchestrationPhase }) => void;
  onAgentEntry?: (params: { slotIndex: SlotIndex; entry: ChatLineEntry['entry'] }) => void;
  abortSignal?: AbortSignal;
}): Promise<void> => {
  const slotCount = slotCountContract.parse(SLOT_COUNT);
  const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });

  try {
    if (abortSignal?.aborted) {
      onPhaseChange({ phase: 'failed' });
      return;
    }
    await codeweaverPhaseLayerBroker({
      questId,
      questFilePath,
      startPath,
      slotCount,
      slotOperations,
      onPhaseChange,
      ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
      ...(abortSignal === undefined ? {} : { abortSignal }),
    });
    if (abortSignal?.aborted) {
      onPhaseChange({ phase: 'failed' });
      return;
    }
    const absoluteStartPath = absoluteFilePathContract.parse(startPath);
    await wardPhaseLayerBroker({
      questFilePath,
      startPath: absoluteStartPath,
      slotCount,
      slotOperations,
      onPhaseChange,
      ...(abortSignal === undefined ? {} : { abortSignal }),
    });
    if (abortSignal?.aborted) {
      onPhaseChange({ phase: 'failed' });
      return;
    }
    await siegemasterPhaseLayerBroker({
      questId,
      questFilePath,
      startPath,
      slotCount,
      slotOperations,
      onPhaseChange,
      ...(abortSignal === undefined ? {} : { abortSignal }),
    });
    if (abortSignal?.aborted) {
      onPhaseChange({ phase: 'failed' });
      return;
    }
    await lawbringerPhaseLayerBroker({
      questFilePath,
      startPath,
      slotCount,
      slotOperations,
      onPhaseChange,
      ...(abortSignal === undefined ? {} : { abortSignal }),
    });
    onPhaseChange({ phase: 'complete' });
  } catch (error: unknown) {
    onPhaseChange({ phase: 'failed' });
    throw error;
  }
};
