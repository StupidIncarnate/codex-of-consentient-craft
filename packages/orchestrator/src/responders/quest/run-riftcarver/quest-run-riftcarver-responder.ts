/**
 * PURPOSE: The MCP-mode entry point for the carve — delegates to questRunRiftcarverBroker and puts
 * its output on the chat bus so a `/dumpster-launch` session shows the branch, worktree and
 * preflight build being forged live. Reach for this over QuestRunWardResponder for the other command
 * role; the two are deliberately the same shape, because the dispatcher-side difference between them
 * is which broker runs, never how their output reaches a UI.
 *
 * USAGE:
 * const result = await QuestRunRiftcarverResponder({ questId, workItemId });
 * // Returns: QuestRunRiftcarverResult — { success, questId, workItemId, exitCode,
 * //   riftcarverResultId, outcome, failedStep? }
 *
 * Riftcarver is `spawnerType: 'command'` and has no sessionId, so the JSONL watcher — which keys on
 * `workItems[].sessionId` and tails Claude session JSONL — can never see it. Wiring `onLine` here is
 * the only way an MCP-dispatched carve reaches the UI, and it runs for minutes, so a dropped
 * callback is a panel that sits blank for the whole workspace forge.
 */

import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

import { questRunRiftcarverBroker } from '../../../brokers/quest/run-riftcarver/quest-run-riftcarver-broker';
import type { QuestRunRiftcarverResult } from '../../../contracts/quest-run-riftcarver-result/quest-run-riftcarver-result-contract';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { commandChatOutputEmitTransformer } from '../../../transformers/command-chat-output-emit/command-chat-output-emit-transformer';

export const QuestRunRiftcarverResponder = async ({
  questId,
  workItemId,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
}): Promise<QuestRunRiftcarverResult> =>
  questRunRiftcarverBroker({
    questId,
    workItemId,
    onLine: (line: string): void => {
      orchestrationEventsState.emit(
        commandChatOutputEmitTransformer({ questId, workItemId, line }),
      );
    },
  });
