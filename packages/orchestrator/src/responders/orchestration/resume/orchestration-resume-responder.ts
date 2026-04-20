/**
 * PURPOSE: Resumes a paused quest by restoring the status stored in pausedAtStatus via questModifyBroker
 *
 * USAGE:
 * const result = await OrchestrationResumeResponder({ questId });
 * // Returns { resumed: true, restoredStatus: 'seek_scope' } when the paused quest transitions back to its pre-pause status
 */

import type { QuestId, QuestStatus } from '@dungeonmaster/shared/contracts';

import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import { isUserPausedQuestStatusGuard } from '@dungeonmaster/shared/guards';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';

export const OrchestrationResumeResponder = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ resumed: boolean; restoredStatus: QuestStatus }> => {
  const input = getQuestInputContract.parse({ questId });
  const getResult = await questGetBroker({ input });

  if (!getResult.success || !getResult.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }

  const { quest } = getResult;

  if (!isUserPausedQuestStatusGuard({ status: quest.status })) {
    throw new Error(`Quest is not paused: ${quest.status}`);
  }

  const restoredStatus = quest.pausedAtStatus;
  if (restoredStatus === undefined) {
    throw new Error(`Quest has no pausedAtStatus snapshot: ${questId}`);
  }

  const modifyResult = await questModifyBroker({
    input: {
      questId,
      status: restoredStatus,
    } as ModifyQuestInput,
  });

  if (!modifyResult.success) {
    throw new Error(`Failed to resume quest ${questId}: ${modifyResult.error ?? 'unknown error'}`);
  }

  return { resumed: true, restoredStatus };
};
