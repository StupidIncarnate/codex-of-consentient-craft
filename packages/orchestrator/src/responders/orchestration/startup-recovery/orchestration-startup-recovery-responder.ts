/**
 * PURPOSE: On server start, scans all guilds for active quests and re-registers them in orchestration state
 *
 * USAGE:
 * const recoveredQuestIds = await OrchestrationStartupRecoveryResponder();
 * // Returns array of quest IDs that were recovered across all guilds
 */

import { processIdContract } from '@dungeonmaster/shared/contracts';
import type { Quest, QuestId } from '@dungeonmaster/shared/contracts';

import { orchestrationProcessContract } from '../../../contracts/orchestration-process/orchestration-process-contract';
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

    const orchestrationProcess = orchestrationProcessContract.parse({
      processId,
      questId: quest.id,
      kill: () => undefined,
    });

    orchestrationProcessesState.register({ orchestrationProcess });
    recoveredIds.push(quest.id);
  }

  return recoveredIds;
};
