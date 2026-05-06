/**
 * PURPOSE: Layer of chatSpawnBroker — resolves the quest + chat work item id for the spawn. Handles three paths: glyphsmith (lookup quest, validate design-phase status, find glyphsmith work item), chaoswhisperer-resume (lookup quest by id, find chaoswhisperer work item), and chaoswhisperer-new (create quest with chaos seed item, then re-fetch to extract the work item id). Centralizing this lookup outside the spawn broker keeps the launcher call free of nested helpers and gives the resolution logic its own test scope.
 *
 * USAGE:
 * const { questId, workItemId } = await resolveChatQuestLayerBroker({
 *   role,
 *   guildId,
 *   questId: existingQuestId,
 *   sessionId: resumeSessionId,
 *   message,
 * });
 */

import { addQuestInputContract, getQuestInputContract } from '@dungeonmaster/shared/contracts';
import type {
  GuildId,
  QuestId,
  QuestWorkItemId,
  SessionId,
  WorkItemRole,
} from '@dungeonmaster/shared/contracts';
import { isDesignPhaseQuestStatusGuard } from '@dungeonmaster/shared/guards';

import { questGetBroker } from '../../quest/get/quest-get-broker';
import { questUserAddBroker } from '../../quest/user-add/quest-user-add-broker';

export const resolveChatQuestLayerBroker = async ({
  role,
  guildId,
  questId,
  sessionId,
  message,
}: {
  role: WorkItemRole;
  guildId: GuildId;
  questId?: QuestId;
  sessionId?: SessionId;
  message: string;
}): Promise<{ questId: QuestId; workItemId: QuestWorkItemId; createdQuest: boolean }> => {
  if (role === 'glyphsmith') {
    if (!questId) {
      throw new Error('questId is required for glyphsmith role');
    }
    const result = await questGetBroker({ input: getQuestInputContract.parse({ questId }) });
    if (!result.success || !result.quest) {
      throw new Error(`Quest not found: ${questId}`);
    }
    if (!isDesignPhaseQuestStatusGuard({ status: result.quest.status })) {
      throw new Error(
        `Quest must be in a design phase (explore_design, review_design, or design_approved) to start design chat. Current status: ${result.quest.status}`,
      );
    }
    const glyphItem = result.quest.workItems.find((wi) => wi.role === 'glyphsmith');
    if (!glyphItem) {
      throw new Error(`Quest ${questId} has no glyphsmith work item`);
    }
    return { questId, workItemId: glyphItem.id, createdQuest: false };
  }

  if (sessionId && questId) {
    const result = await questGetBroker({ input: getQuestInputContract.parse({ questId }) });
    if (!result.success || !result.quest) {
      throw new Error(`Quest not found: ${questId}`);
    }
    const chaosItem = result.quest.workItems.find((wi) => wi.role === 'chaoswhisperer');
    if (!chaosItem) {
      throw new Error(`Quest ${questId} has no chaoswhisperer work item`);
    }
    return { questId, workItemId: chaosItem.id, createdQuest: false };
  }

  const addInput = addQuestInputContract.parse({ title: 'New Quest', userRequest: message });
  const questResult = await questUserAddBroker({ input: addInput, guildId });
  if (!questResult.success || !questResult.questId || !questResult.chaoswhispererWorkItemId) {
    throw new Error(`Failed to create quest: ${questResult.error ?? 'unknown'}`);
  }
  return {
    questId: questResult.questId,
    workItemId: questResult.chaoswhispererWorkItemId,
    createdQuest: true,
  };
};
