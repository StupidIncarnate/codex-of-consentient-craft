/**
 * PURPOSE: Layer of chatSpawnBroker — resolves the quest + chat work item id for the spawn. Handles
 * four paths: glyphsmith (lookup quest, validate design-phase status, find glyphsmith work item),
 * tavernkeeper (lookup quest by id, find the tavernkeeper work item by role alone — the calling
 * responder always creates that item before this ever runs), intake-resume (lookup quest by id, find
 * the work item matching the spawn's chat role), and intake-new (create a quest of the requested type
 * with its intake seed item, whose id the create returns). Centralizing this lookup outside the spawn
 * broker keeps the launcher call free of nested helpers and gives the resolution logic its own test
 * scope.
 *
 * USAGE:
 * const { questId, workItemId } = await resolveChatQuestLayerBroker({
 *   role,
 *   guildId,
 *   questType,
 *   questId: existingQuestId,
 *   sessionId: resumeSessionId,
 *   message,
 * });
 */

import { addQuestInputContract, getQuestInputContract } from '@dungeonmaster/shared/contracts';
import type {
  GuildId,
  QuestId,
  QuestType,
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
  questType,
  questId,
  sessionId,
  message,
}: {
  role: WorkItemRole;
  guildId: GuildId;
  questType?: QuestType;
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

  if (role === 'tavernkeeper') {
    if (!questId) {
      throw new Error('questId is required for tavernkeeper role');
    }
    const result = await questGetBroker({ input: getQuestInputContract.parse({ questId }) });
    if (!result.success || !result.quest) {
      throw new Error(`Quest not found: ${questId}`);
    }
    // Matches on role alone, ignoring the work item's status. Chat work items are never driven
    // to a terminal status — a tavernkeeper item sits inert on the quest the same way a
    // chaoswhisperer item does, so a session killed by a server crash or stopped for a merge
    // leaves it sitting in_progress (or failed) forever. The next follow-up message must still
    // resolve to that same item so its sessionId is resumed rather than a second item being
    // minted, whatever state the session left it in.
    const tavernkeeperItem = result.quest.workItems.find((wi) => wi.role === 'tavernkeeper');
    if (!tavernkeeperItem) {
      throw new Error(`Quest ${questId} has no tavernkeeper work item`);
    }
    return { questId, workItemId: tavernkeeperItem.id, createdQuest: false };
  }

  if (sessionId && questId) {
    const result = await questGetBroker({ input: getQuestInputContract.parse({ questId }) });
    if (!result.success || !result.quest) {
      throw new Error(`Quest not found: ${questId}`);
    }
    // Match the spawn's own role, not chaoswhisperer specifically: a bug-hunt quest's intake item
    // is a `bughunt` item, and resuming it against a chaoswhisperer lookup would find nothing.
    const intakeItem = result.quest.workItems.find((wi) => wi.role === role);
    if (!intakeItem) {
      throw new Error(`Quest ${questId} has no ${role} work item`);
    }
    return { questId, workItemId: intakeItem.id, createdQuest: false };
  }

  const addInput = addQuestInputContract.parse({
    title: 'New Quest',
    userRequest: message,
    ...(questType === undefined ? {} : { questType }),
  });
  const questResult = await questUserAddBroker({ input: addInput, guildId });
  if (!questResult.success || !questResult.questId || !questResult.intakeWorkItemId) {
    throw new Error(`Failed to create quest: ${questResult.error ?? 'unknown'}`);
  }
  return {
    questId: questResult.questId,
    workItemId: questResult.intakeWorkItemId,
    createdQuest: true,
  };
};
