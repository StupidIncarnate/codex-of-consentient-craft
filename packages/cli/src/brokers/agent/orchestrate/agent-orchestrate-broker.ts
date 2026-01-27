/**
 * PURPOSE: Orchestrates the ChaosWhisperer -> PathSeeker -> SlotManager agent pipeline
 *
 * USAGE:
 * await agentOrchestrateBroker({userInput, questId, questFilePath, slotCount, timeoutMs, slotOperations, getQuest});
 * // Spawns ChaosWhisperer, then PathSeeker if quest is ready, then SlotManager for parallel execution
 */

import type {
  ExitCode,
  FilePath,
  Quest,
  QuestId,
  UserInput,
} from '@dungeonmaster/shared/contracts';

import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotManagerResult } from '../../../contracts/slot-manager-result/slot-manager-result-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { isQuestReadyForPathseekerGuard } from '../../../guards/is-quest-ready-for-pathseeker/is-quest-ready-for-pathseeker-guard';
import { chaoswhispererSpawnBroker } from '../../chaoswhisperer/spawn/chaoswhisperer-spawn-broker';
import { pathseekerSpawnBroker } from '../../pathseeker/spawn/pathseeker-spawn-broker';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';

export const agentOrchestrateBroker = async ({
  userInput,
  questId,
  questFilePath,
  slotCount,
  timeoutMs,
  slotOperations,
  getQuest,
}: {
  userInput: UserInput;
  questId: QuestId;
  questFilePath: FilePath;
  slotCount: SlotCount;
  timeoutMs: TimeoutMs;
  slotOperations: SlotOperations;
  getQuest: (params: { questId: QuestId }) => Promise<{ quest: Quest }>;
}): Promise<{
  chaoswhispererExitCode: ExitCode | null;
  pathseekerExitCode: ExitCode | null;
  pathseekerSkipped: boolean;
  slotManagerResult: SlotManagerResult | null;
  slotManagerSkipped: boolean;
}> => {
  // 1. Spawn ChaosWhisperer
  const chaoswhispererResult = await chaoswhispererSpawnBroker({ userInput });

  // 2. If ChaosWhisperer exits non-zero, return early
  if (chaoswhispererResult.exitCode !== null && chaoswhispererResult.exitCode !== 0) {
    return {
      chaoswhispererExitCode: chaoswhispererResult.exitCode,
      pathseekerExitCode: null,
      pathseekerSkipped: true,
      slotManagerResult: null,
      slotManagerSkipped: true,
    };
  }

  // 3. Get quest from storage
  const { quest } = await getQuest({ questId });

  // 4. Check if quest is ready for PathSeeker
  const isReady = isQuestReadyForPathseekerGuard({ quest });

  if (!isReady) {
    return {
      chaoswhispererExitCode: chaoswhispererResult.exitCode,
      pathseekerExitCode: null,
      pathseekerSkipped: true,
      slotManagerResult: null,
      slotManagerSkipped: true,
    };
  }

  // 5. Spawn PathSeeker
  const pathseekerResult = await pathseekerSpawnBroker({ questId });

  // 6. If PathSeeker exits non-zero, return early
  if (pathseekerResult.exitCode !== null && pathseekerResult.exitCode !== 0) {
    return {
      chaoswhispererExitCode: chaoswhispererResult.exitCode,
      pathseekerExitCode: pathseekerResult.exitCode,
      pathseekerSkipped: false,
      slotManagerResult: null,
      slotManagerSkipped: true,
    };
  }

  // 7. Run SlotManager orchestration for parallel step execution
  const slotManagerResult = await slotManagerOrchestrateBroker({
    questFilePath,
    slotCount,
    timeoutMs,
    slotOperations,
  });

  // 8. Return results
  return {
    chaoswhispererExitCode: chaoswhispererResult.exitCode,
    pathseekerExitCode: pathseekerResult.exitCode,
    pathseekerSkipped: false,
    slotManagerResult,
    slotManagerSkipped: false,
  };
};
