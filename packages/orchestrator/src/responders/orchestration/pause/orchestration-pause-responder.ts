/**
 * PURPOSE: Pauses a running quest by delegating to questPauseBroker — looks up the quest's current status, then invokes the shared pause pipeline. Throws when the quest is missing or the pause persist fails.
 *
 * USAGE:
 * const result = await OrchestrationPauseResponder({ questId });
 * // Returns { paused: true } on success, throws when the quest is not found or the pause fails to persist.
 */

import { randomUUID } from '#gateway/node/crypto';
import type { Quest } from '@dungeonmaster/shared/contracts';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';

import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questPauseBroker } from '../../../brokers/quest/pause/quest-pause-broker';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

export const OrchestrationPauseResponder = async ({
  questId,
}: {
  questId: Quest['id'];
}): Promise<{ paused: boolean }> => {
  const getResult = await questGetBroker({
    input: getQuestInputContract.parse({ questId }),
  });

  if (!getResult.success || getResult.quest === undefined) {
    throw new Error(`Quest not found: ${questId}`);
  }

  const { quest } = getResult;

  // Read the announcement id BEFORE the pause: killing a registration removes it, so a lookup
  // afterwards would find nothing and mint a synthetic id for a process that really existed.
  const existingProcess = orchestrationProcessesState.findByQuestId({ questId });
  const announcementProcessId =
    existingProcess?.processId ?? `proc-pause-${randomUUID()}`;

  const result = await questPauseBroker({
    questId,
    previousStatus: quest.status,
    processControls: {
      findAllByQuestId: orchestrationProcessesState.findAllByQuestId,
      kill: orchestrationProcessesState.kill,
    },
  });

  if (!result.paused) {
    throw new Error(`Failed to pause quest: ${questId}`);
  }

  orchestrationEventsState.emit({
    type: 'quest-paused',
    processId: announcementProcessId,
    payload: {
      questId,
      previousStatus: quest.status,
    },
  });

  return result;
};
