/**
 * PURPOSE: Orchestrates the ChaosWhisperer -> PathSeeker agent pipeline
 *
 * USAGE:
 * await agentOrchestrateBroker({userInput, questId, getQuest});
 * // Spawns ChaosWhisperer, then PathSeeker if quest is ready
 */

import type { ExitCode, Quest, QuestId, UserInput } from '@dungeonmaster/shared/contracts';

import { isQuestReadyForPathseekerGuard } from '../../../guards/is-quest-ready-for-pathseeker/is-quest-ready-for-pathseeker-guard';
import { chaoswhispererSpawnBroker } from '../../chaoswhisperer/spawn/chaoswhisperer-spawn-broker';
import { pathseekerSpawnBroker } from '../../pathseeker/spawn/pathseeker-spawn-broker';

export const agentOrchestrateBroker = async ({
  userInput,
  questId,
  getQuest,
}: {
  userInput: UserInput;
  questId: QuestId;
  getQuest: (params: { questId: QuestId }) => Promise<{ quest: Quest }>;
}): Promise<{
  chaoswhispererExitCode: ExitCode | null;
  pathseekerExitCode: ExitCode | null;
  pathseekerSkipped: boolean;
}> => {
  // 1. Spawn ChaosWhisperer
  const chaoswhispererResult = await chaoswhispererSpawnBroker({ userInput });

  // 2. If ChaosWhisperer exits non-zero, return early
  if (chaoswhispererResult.exitCode !== null && chaoswhispererResult.exitCode !== 0) {
    return {
      chaoswhispererExitCode: chaoswhispererResult.exitCode,
      pathseekerExitCode: null,
      pathseekerSkipped: true,
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
    };
  }

  // 5. Spawn PathSeeker
  const pathseekerResult = await pathseekerSpawnBroker({ questId });

  // 6. Return results
  return {
    chaoswhispererExitCode: chaoswhispererResult.exitCode,
    pathseekerExitCode: pathseekerResult.exitCode,
    pathseekerSkipped: false,
  };
};
