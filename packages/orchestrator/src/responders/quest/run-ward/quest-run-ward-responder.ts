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
 * is the only way MCP-dispatched ward runs reach the UI.
 */

import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';
import { processIdContract } from '@dungeonmaster/shared/contracts';

import { questRunWardBroker } from '../../../brokers/quest/run-ward/quest-run-ward-broker';
import { chatOutputEmitPayloadContract } from '../../../contracts/chat-output-emit-payload/chat-output-emit-payload-contract';
import type { QuestRunWardResult } from '../../../contracts/quest-run-ward-result/quest-run-ward-result-contract';
import { slotIndexContract } from '@dungeonmaster/shared/contracts';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { wardLineToChatEntryTransformer } from '../../../transformers/ward-line-to-chat-entry/ward-line-to-chat-entry-transformer';

export const QuestRunWardResponder = async ({
  questId,
  workItemId,
  mode,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  mode: 'changed' | 'full';
}): Promise<QuestRunWardResult> => {
  // Key the chat process on the work item so the execution panel groups the lines under the
  // ward row — ward has no sessionId to key on.
  const chatProcessId = processIdContract.parse(String(workItemId));

  return questRunWardBroker({
    questId,
    workItemId,
    mode,
    onLine: (line: string): void => {
      orchestrationEventsState.emit({
        type: 'chat-output',
        processId: chatProcessId,
        payload: chatOutputEmitPayloadContract.parse({
          processId: chatProcessId,
          chatProcessId,
          // Ward runs serially, one work item at a time — slot 0 is the only slot it can occupy.
          slotIndex: slotIndexContract.parse(0),
          entries: [wardLineToChatEntryTransformer({ line })],
          questId,
          workItemId,
        }),
      });
    },
  });
};
