/**
 * PURPOSE: Orchestrates the full quest pipeline: codeweaver -> ward -> siegemaster -> lawbringer
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

import type { OrchestrationPhase } from '../../../contracts/orchestration-phase/orchestration-phase-contract';
import { codeweaverPhaseLayerBroker } from './codeweaver-phase-layer-broker';
import { lawbringerPhaseLayerBroker } from './lawbringer-phase-layer-broker';
import { siegemasterPhaseLayerBroker } from './siegemaster-phase-layer-broker';
import { wardPhaseLayerBroker } from './ward-phase-layer-broker';

export const questPipelineBroker = async ({
  processId: _processId,
  questId,
  questFilePath,
  startPath,
  onPhaseChange,
}: {
  processId: ProcessId;
  questId: QuestId;
  questFilePath: FilePath;
  startPath: FilePath;
  onPhaseChange: (params: { phase: OrchestrationPhase }) => void;
}): Promise<void> => {
  try {
    await codeweaverPhaseLayerBroker({ questId, questFilePath, onPhaseChange });
    const absoluteStartPath = absoluteFilePathContract.parse(startPath);
    await wardPhaseLayerBroker({ questFilePath, startPath: absoluteStartPath, onPhaseChange });
    await siegemasterPhaseLayerBroker({ questId, questFilePath, onPhaseChange });
    await lawbringerPhaseLayerBroker({ questFilePath, onPhaseChange });
    onPhaseChange({ phase: 'complete' });
  } catch (error: unknown) {
    onPhaseChange({ phase: 'failed' });
    throw error;
  }
};
