/**
 * PURPOSE: Deletes a quest folder from disk. Rejects if the quest is actively executing — caller must pause or abandon first. Allowed when the quest is terminal, user-paused, or still pre-execution.
 *
 * USAGE:
 * const result = await OrchestrationDeleteResponder({ questId, guildId });
 * // Returns { deleted: true } on success. Throws if the quest is active or not found.
 */

import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, QuestId } from '@dungeonmaster/shared/contracts';
import {
  isPreExecutionQuestStatusGuard,
  isTerminalQuestStatusGuard,
  isUserPausedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

import { questDeleteBroker } from '../../../brokers/quest/delete/quest-delete-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';

export const OrchestrationDeleteResponder = async ({
  questId,
  guildId,
}: {
  questId: QuestId;
  guildId: GuildId;
}): Promise<{ deleted: boolean }> => {
  const input = getQuestInputContract.parse({ questId });
  const result = await questGetBroker({ input });

  if (!result.success || !result.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }

  const { quest } = result;

  const isDeletable =
    isTerminalQuestStatusGuard({ status: quest.status }) ||
    isUserPausedQuestStatusGuard({ status: quest.status }) ||
    isPreExecutionQuestStatusGuard({ status: quest.status });

  if (!isDeletable) {
    throw new Error(
      `Quest must be in a terminal, paused, or pre-execution status to delete — current status is "${quest.status}". Pause or abandon the quest first.`,
    );
  }

  await questDeleteBroker({ questId, guildId });

  return { deleted: true };
};
