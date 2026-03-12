/**
 * PURPOSE: Orchestrates the full quest pipeline: pathseeker -> codeweaver -> ward -> siegemaster -> lawbringer
 *
 * USAGE:
 * await questPipelineBroker({processId, questId, questFilePath, startPath, onPhaseChange});
 * // Runs all phases sequentially, calls onPhaseChange('complete') on success
 */

import {
  absoluteFilePathContract,
  type FilePath,
  type ProcessId,
  type QuestId,
} from '@dungeonmaster/shared/contracts';

import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import type { OrchestrationPhase } from '../../../contracts/orchestration-phase/orchestration-phase-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { codeweaverPhaseLayerBroker } from './codeweaver-phase-layer-broker';
import { lawbringerPhaseLayerBroker } from './lawbringer-phase-layer-broker';
import { pathseekerPhaseLayerBroker } from './pathseeker-phase-layer-broker';
import { siegemasterPhaseLayerBroker } from './siegemaster-phase-layer-broker';
import { wardPhaseLayerBroker } from './ward-phase-layer-broker';

export const questPipelineBroker = async ({
  processId,
  questId,
  questFilePath,
  startPath,
  onPhaseChange,
  onAgentEntry,
}: {
  processId: ProcessId;
  questId: QuestId;
  questFilePath: FilePath;
  startPath: FilePath;
  onPhaseChange: (params: { phase: OrchestrationPhase }) => void;
  onAgentEntry?: (params: { slotIndex: SlotIndex; entry: ChatLineEntry['entry'] }) => void;
}): Promise<void> => {
  try {
    await pathseekerPhaseLayerBroker({
      processId,
      questId,
      startPath,
      onPhaseChange,
      ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
    });
    await codeweaverPhaseLayerBroker({
      questId,
      questFilePath,
      startPath,
      onPhaseChange,
      ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
    });
    const absoluteStartPath = absoluteFilePathContract.parse(startPath);
    await wardPhaseLayerBroker({ questFilePath, startPath: absoluteStartPath, onPhaseChange });
    await siegemasterPhaseLayerBroker({ questId, questFilePath, startPath, onPhaseChange });
    await lawbringerPhaseLayerBroker({ questFilePath, startPath, onPhaseChange });
    onPhaseChange({ phase: 'complete' });
  } catch (error: unknown) {
    onPhaseChange({ phase: 'failed' });
    throw error;
  }
};
