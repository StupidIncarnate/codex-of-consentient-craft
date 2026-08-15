/**
 * PURPOSE: Responder for the MCP run-ward tool — delegates to questRunWardBroker and streams ward's
 * output onto the chat bus so the workspace shows the run live.
 *
 * USAGE:
 * const result = await QuestRunWardResponder({ questId, workItemId, mode: 'changed' });
 * // Returns: QuestRunWardResult — { success, exitCode, wardResultId, lastWardRunId? }
 *
 * Ward is `spawnerType: 'command'` and has no sessionId, so the JSONL watcher — which keys on
 * `workItems[].sessionId` and tails Claude session JSONL — can never see it. Wiring `onLine` here
 * is the only way MCP-dispatched ward runs reach the UI. The event it emits is built by
 * `commandChatOutputEmitTransformer`, shared with the other command role and with the Node
 * dispatcher's bootstrap, so all three route a line to the same place.
 */

import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

import { questRunWardBroker } from '../../../brokers/quest/run-ward/quest-run-ward-broker';
import type { QuestRunWardResult } from '../../../contracts/quest-run-ward-result/quest-run-ward-result-contract';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { commandChatOutputEmitTransformer } from '../../../transformers/command-chat-output-emit/command-chat-output-emit-transformer';

export const QuestRunWardResponder = async ({
  questId,
  workItemId,
  mode,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  mode: 'changed' | 'full';
}): Promise<QuestRunWardResult> =>
  questRunWardBroker({
    questId,
    workItemId,
    mode,
    onLine: (line: string): void => {
      orchestrationEventsState.emit(
        commandChatOutputEmitTransformer({ questId, workItemId, line }),
      );
    },
  });
