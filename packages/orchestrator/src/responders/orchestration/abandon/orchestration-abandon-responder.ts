/**
 * PURPOSE: Abandons a quest by killing its orchestration process if running and setting quest status to abandoned
 *
 * USAGE:
 * const result = await OrchestrationAbandonResponder({ questId });
 * // Returns { abandoned: true } on success. Throws if quest not found or transition rejected.
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

export const OrchestrationAbandonResponder = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ abandoned: boolean }> => {
  const existingProcess = orchestrationProcessesState.findByQuestId({ questId });

  if (existingProcess) {
    orchestrationProcessesState.kill({ processId: existingProcess.processId });
  }

  const input = getQuestInputContract.parse({ questId });
  const result = await questGetBroker({ input });

  if (!result.success || !result.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }

  const modifyResult = await questModifyBroker({
    input: {
      questId,
      status: 'abandoned',
    } as ModifyQuestInput,
  });

  if (!modifyResult.success) {
    throw new Error(modifyResult.error ?? 'Failed to abandon quest');
  }

  return { abandoned: true };
};
