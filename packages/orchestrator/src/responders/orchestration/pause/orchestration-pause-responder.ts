/**
 * PURPOSE: Pauses a running quest by delegating to questPauseBroker — looks up the quest's current status, then invokes the shared pause pipeline. Throws when the quest is missing or the pause persist fails.
 *
 * USAGE:
 * const result = await OrchestrationPauseResponder({ questId });
 * // Returns { paused: true } on success, throws when the quest is not found or the pause fails to persist.
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';

import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questPauseBroker } from '../../../brokers/quest/pause/quest-pause-broker';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

export const OrchestrationPauseResponder = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ paused: boolean }> => {
  const getResult = await questGetBroker({
    input: getQuestInputContract.parse({ questId }),
  });

  if (!getResult.success || getResult.quest === undefined) {
    throw new Error(`Quest not found: ${questId}`);
  }

  const { quest } = getResult;

  const result = await questPauseBroker({
    questId,
    previousStatus: quest.status,
    processControls: {
      findByQuestId: orchestrationProcessesState.findByQuestId,
      kill: orchestrationProcessesState.kill,
    },
  });

  if (!result.paused) {
    throw new Error(`Failed to pause quest: ${questId}`);
  }

  return result;
};
