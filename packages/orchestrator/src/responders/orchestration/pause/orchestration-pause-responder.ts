/**
 * PURPOSE: Pauses a running quest by killing its orchestration process, resetting in_progress work items to pending, and setting quest status to paused
 *
 * USAGE:
 * const result = await OrchestrationPauseResponder({ questId });
 * // Returns { paused: true } if quest was paused, { paused: false } if no running process found
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

export const OrchestrationPauseResponder = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ paused: boolean }> => {
  const existingProcess = orchestrationProcessesState.findByQuestId({ questId });

  if (existingProcess) {
    orchestrationProcessesState.kill({ processId: existingProcess.processId });
  }

  const input = getQuestInputContract.parse({ questId });
  const result = await questGetBroker({ input });

  if (!result.success || !result.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }

  const { quest } = result;

  const orphanedItems = quest.workItems
    .filter((wi) => wi.status === 'in_progress')
    .map((wi) => ({ id: wi.id, status: 'pending' as const }));

  await questModifyBroker({
    input: {
      questId,
      status: 'paused',
      ...(orphanedItems.length > 0 ? { workItems: orphanedItems } : {}),
    } as ModifyQuestInput,
  });

  return { paused: true };
};
