/**
 * PURPOSE: On server start, scans all guilds for active quests and re-registers them in orchestration state
 *
 * USAGE:
 * const recoveredQuestIds = await OrchestrationStartupRecoveryResponder();
 * // Returns array of quest IDs that were recovered across all guilds
 */

import { processIdContract } from '@dungeonmaster/shared/contracts';
import type { Quest, QuestId } from '@dungeonmaster/shared/contracts';

import { completedCountContract } from '../../../contracts/completed-count/completed-count-contract';
import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import { orchestrationProcessContract } from '../../../contracts/orchestration-process/orchestration-process-contract';
import { totalCountContract } from '../../../contracts/total-count/total-count-contract';
import { isRecoverableQuestStatusGuard } from '../../../guards/is-recoverable-quest-status/is-recoverable-quest-status-guard';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

export const OrchestrationStartupRecoveryResponder = ({
  quests,
}: {
  quests: Quest[];
}): QuestId[] => {
  const recoverableQuests = quests.filter((quest) =>
    isRecoverableQuestStatusGuard({ status: quest.status }),
  );

  const recoveredIds: QuestId[] = [];

  for (const quest of recoverableQuests) {
    const processId = processIdContract.parse(`proc-${crypto.randomUUID()}`);
    const totalSteps = totalCountContract.parse(quest.steps.length);
    const completedSteps = completedCountContract.parse(
      quest.steps.filter((step) => step.status === 'complete').length,
    );

    const orchestrationProcess = orchestrationProcessContract.parse({
      processId,
      questId: quest.id,
      process: {
        kill: () => true,
        waitForExit: async () => Promise.resolve(),
      },
      phase: 'idle',
      completedSteps,
      totalSteps,
      startedAt: isoTimestampContract.parse(new Date().toISOString()),
      slots: [],
    });

    orchestrationProcessesState.register({ orchestrationProcess });
    recoveredIds.push(quest.id);
  }

  return recoveredIds;
};
