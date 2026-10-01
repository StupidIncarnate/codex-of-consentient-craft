/**
 * PURPOSE: Replays a finished `spawnerType: 'command'` work item's printed output — ward, a carve,
 * a commit — as `chat-output` frames, the way `ChatReplayResponder` replays an agent's session.
 * A command step has no session JSONL to read back, so its saved output (`declaredReason`, the
 * handler's whole printed text) is the source. The entries come from the same funnel the live
 * stream uses, so a reloaded row reads exactly like the row that streamed.
 *
 * USAGE:
 * ChatCommandReplayResponder({ questId, workItem, chatProcessId: 'quest-replay-<quest>-<item>-command' });
 * // Emits chat-output (replay: true) when the item saved any output, then chat-history-complete
 */

import type { Quest, WorkItem } from '@dungeonmaster/shared/contracts';

import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { commandOutputToChatEntriesTransformer } from '../../../transformers/command-output-to-chat-entries/command-output-to-chat-entries-transformer';

export const ChatCommandReplayResponder = ({
  questId,
  workItem,
  chatProcessId,
}: {
  questId: Quest['id'];
  workItem: WorkItem;
  chatProcessId: string;
}): void => {
  const entries = commandOutputToChatEntriesTransformer({
    text: String(workItem.declaredReason ?? ''),
  });

  if (entries.length > 0) {
    orchestrationEventsState.emit({
      type: 'chat-output',
      processId: chatProcessId,
      // No slotIndex: the server batches a frame carrying one, and a batched replay frame can
      // land after this replay's chat-history-complete.
      payload: {
        chatProcessId,
        entries,
        // Read back off disk, never a command running — the web arms no running indicator for it.
        replay: true,
        questId,
        workItemId: workItem.id,
      },
    });
  }

  orchestrationEventsState.emit({
    type: 'chat-history-complete',
    processId: chatProcessId,
    payload: { chatProcessId, questId, workItemId: workItem.id },
  });
};
