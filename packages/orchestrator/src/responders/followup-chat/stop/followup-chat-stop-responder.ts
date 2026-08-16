/**
 * PURPOSE: Stops the tavernkeeper mid-turn when the reader presses STOP on the FOLLOW-UP tab.
 * Reach for this rather than `OrchestrationPauseResponder`, which is what that button used to
 * call: pause kills EVERY process on the quest and then flips quest status to `paused`, and a
 * follow-up chat only ever runs on a quest that is already `blocked` / `complete` / `merged`. On
 * `complete` and `merged` that status flip is not even a legal transition, so the pause errored
 * after the kill; on `blocked` it succeeded and quietly took the whole quest — and the FOLLOW-UP
 * tab with it, since `paused` is not follow-up-chatable.
 *
 * It kills the PROCESS and writes nothing. The tavernkeeper work item is deliberately left as it
 * stands so the next message resumes the same conversation: `FollowupChatStartResponder` matches
 * that item on role alone, whatever state a stop or a crash left it in, and the spawn's own
 * `onComplete` is what closes the item out and emits the `chat-complete` the browser's running
 * indicator clears on.
 *
 * USAGE:
 * const { stopped } = await FollowupChatStopResponder({ questId });
 * // stopped is false when the quest has no tavernkeeper item or nothing is registered for it —
 * // a STOP pressed before the spawn registered or after the turn ended, not an error
 */

import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';
import { isPostQuestChatWorkItemRoleGuard } from '@dungeonmaster/shared/guards';

import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

export const FollowupChatStopResponder = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ stopped: boolean }> => {
  const questResult = await questGetBroker({ input: getQuestInputContract.parse({ questId }) });

  if (!questResult.success || !questResult.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }

  const followupItem = questResult.quest.workItems.find((workItem) =>
    isPostQuestChatWorkItemRoleGuard({ role: workItem.role }),
  );
  if (followupItem === undefined) {
    return { stopped: false };
  }

  // Scoped by WORK ITEM, never by quest. `findAllByQuestId` is what pause uses, and on a quest
  // whose relay is still registered that would kill agents this button never claimed to touch.
  const runningProcess = orchestrationProcessesState.findByQuestWorkItemId({
    questWorkItemId: followupItem.id,
  });
  if (runningProcess === undefined) {
    return { stopped: false };
  }

  return { stopped: orchestrationProcessesState.kill({ processId: runningProcess.processId }) };
};
