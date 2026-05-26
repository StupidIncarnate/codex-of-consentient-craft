/**
 * PURPOSE: Responder invoked after a sub-agent's `signal-back` MCP call is validated.
 * Transitions the named work item to its terminal status (`complete` for the `complete`
 * signal, `failed` for `failed` / `failed-replan`) and stamps `completedAt`. When the
 * work item's role is `pathseeker-walk` AND the signal is `complete`, additionally fires
 * `questPostWalkHookBroker` to generate the downstream codeweaver/ward/siegemaster/
 * lawbringer/blightwarden chain.
 *
 * The status transition is the only path that flips a Task-dispatched sub-agent's work
 * item out of `in_progress` under the `/dumpster-launch` model — without it the next
 * `get-next-step` scan sees the item still active, its dependents stay blocked, and the
 * orchestrator returns `idle`.
 *
 * USAGE:
 * await QuestHandleSignalBackResponder({ questId, workItemId, signal: 'complete' });
 * // Persists workItems: [{ id: workItemId, status: 'complete', completedAt }] and (for
 * // pathseeker-walk + complete) generates the downstream work-item chain.
 */

import type {
  AdapterResult,
  ModifyQuestInput,
  QuestId,
  QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';
import {
  adapterResultContract,
  folderTypeGroupsContract,
  getQuestInputContract,
} from '@dungeonmaster/shared/contracts';

import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
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
  const input = getQuestInputContract.parse({ questId });
  const result = await questGetBroker({ input });
  if (!result.success || !result.quest) {
    return adapterResultContract.parse({ success: true });
  }

  const workItem = result.quest.workItems.find((wi) => wi.id === workItemId);
  if (!workItem) {
    return adapterResultContract.parse({ success: true });
  }

  const completedAt = new Date().toISOString();
  const terminalStatus = signal === 'complete' ? 'complete' : 'failed';

  await questModifyBroker({
    input: {
      questId,
      workItems: [{ id: workItemId, status: terminalStatus, completedAt }],
    } as ModifyQuestInput,
  });

  if (signal === 'complete' && workItem.role === 'pathseeker-walk') {
    await questPostWalkHookBroker({
      questId,
      walkWorkItemId: workItemId,
      batchGroups: folderTypeGroupsContract.parse(undefined),
    });
  }

  return adapterResultContract.parse({ success: true });
};
