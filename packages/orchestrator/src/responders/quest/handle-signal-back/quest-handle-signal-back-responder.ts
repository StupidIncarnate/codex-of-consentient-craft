/**
 * PURPOSE: Responder invoked after a sub-agent's `signal-back` MCP call is validated. Reads the
 * named work item from the quest; when the role is `pathseeker-walk` and the signal is `complete`,
 * fires `questPostWalkHookBroker` to generate the downstream codeweaver/ward/siegemaster/lawbringer
 * /blightwarden chain. For every other role + signal pair this is a no-op — slot-manager-style
 * routing is owned by the in-process `handleSignalLayerBroker`, which no longer fires under the
 * `/dumpster-launch` model.
 *
 * USAGE:
 * await QuestHandleSignalBackResponder({ questId, workItemId, signal: 'complete' });
 * // Triggers post-walk hook only when the work item's role is `pathseeker-walk` and the signal is `complete`.
 */

import type { AdapterResult, QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';
import {
  adapterResultContract,
  folderTypeGroupsContract,
  getQuestInputContract,
} from '@dungeonmaster/shared/contracts';

import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questPostWalkHookBroker } from '../../../brokers/quest/post-walk-hook/quest-post-walk-hook-broker';

export const QuestHandleSignalBackResponder = async ({
  questId,
  workItemId,
  signal,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  signal: 'complete' | 'failed' | 'failed-replan';
}): Promise<AdapterResult> => {
  if (signal !== 'complete') {
    return adapterResultContract.parse({ success: true });
  }

  const input = getQuestInputContract.parse({ questId });
  const result = await questGetBroker({ input });
  if (!result.success || !result.quest) {
    return adapterResultContract.parse({ success: true });
  }

  const walkItem = result.quest.workItems.find((wi) => wi.id === workItemId);
  if (!walkItem || walkItem.role !== 'pathseeker-walk') {
    return adapterResultContract.parse({ success: true });
  }

  await questPostWalkHookBroker({
    questId,
    walkWorkItemId: workItemId,
    batchGroups: folderTypeGroupsContract.parse(undefined),
  });

  return adapterResultContract.parse({ success: true });
};
