/**
 * PURPOSE: Replays a chat session's history and links any associated quest. Emits chat-output / quest-session-linked / chat-history-complete events stamped with questId+workItemId when the session is linked to a quest. Orphan sessions (no linked quest) still emit chat-output frames without those fields — the server filters those out of per-quest broadcasts and routes them only to the requesting readonly viewer client (SessionViewWidget).
 *
 * USAGE:
 * await ChatReplayResponder({ sessionId, guildId, chatProcessId });
 * // Replays JSONL history via callbacks and emits quest-session-linked if a quest is found
 */

import { randomUUID } from '#gateway/node/crypto';
import { isFsError } from '#gateway/node/fs';
import type { ProcessId, Quest, Guild, Session } from '@dungeonmaster/shared/contracts';
import { processIdContract } from '@dungeonmaster/shared/contracts';

import { chatHistoryReplayBroker } from '../../../brokers/chat/history-replay/chat-history-replay-broker';
import { questListBroker } from '../../../brokers/quest/list/quest-list-broker';
import { linkedQuestInfoContract } from '../../../contracts/linked-quest-info/linked-quest-info-contract';
import type { LinkedQuestInfo } from '../../../contracts/linked-quest-info/linked-quest-info-contract';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';

export const ChatReplayResponder = async ({
  sessionId,
  guildId,
  chatProcessId: clientChatProcessId,
}: {
  sessionId: Session['id'];
  guildId: Guild['id'];
  chatProcessId?: ProcessId;
}): Promise<void> => {
  const chatProcessId = clientChatProcessId ?? processIdContract.parse(`replay-${randomUUID()}`);

  // Look up the linked quest BEFORE replay so chat-output frames can be stamped with
  // questId+workItemId when available. Orphan sessions (no linked quest) still emit
  // chat-output frames without those fields — the server filters them out of per-quest
  // broadcasts and routes them only to the requesting readonly viewer client.
  //
  // `sessionId` alone identifies the work item: every dispatched session (Node child, chat
  // role) is its own dedicated top-level session, so no two work items on a quest share one.
  //
  // Only a guild with no quests directory yet (ENOENT) reads as "no quests". Any other lookup
  // failure rejects, and so does a linked-quest value that fails its contract: a replay that
  // silently downgrades a linked session to an orphan hides a broken quest from the operator.
  const quests = await (async (): Promise<Quest[]> => {
    try {
      return await questListBroker({ guildId });
    } catch (error: unknown) {
      if (isFsError({ error, code: 'ENOENT' })) {
        return [];
      }
      throw error;
    }
  })();
  const linkedQuest = quests.find((quest) =>
    quest.workItems.some((wi) => wi.sessionId === sessionId),
  );
  const matchedWorkItem = linkedQuest?.workItems.find((wi) => wi.sessionId === sessionId);
  const linked: LinkedQuestInfo | null =
    linkedQuest === undefined
      ? null
      : linkedQuestInfoContract.parse({
          questId: linkedQuest.id,
          ...(matchedWorkItem
            ? { workItemId: matchedWorkItem.id, role: matchedWorkItem.role }
            : {}),
        });

  // Build the routing fragment once. Linked sessions stamp questId/workItemId on every
  // payload; orphan sessions leave them off so the server can route to the requesting
  // readonly viewer client only.
  const questIdFragment = linked?.questId === undefined ? {} : { questId: linked.questId };
  const workItemIdFragment =
    linked?.workItemId === undefined ? {} : { workItemId: linked.workItemId };
  const roleFragment = linked?.role === undefined ? {} : { role: linked.role };

  try {
    await chatHistoryReplayBroker({
      sessionId,
      guildId,
      // A linked quest's sessions were spawned with its worktree as cwd, so their JSONL lives
      // under the worktree-derived session directory. Handing the questId down is what lets
      // replay look there; an orphan session has no quest and keeps the guild-path resolution.
      ...questIdFragment,
      onEntries: ({ entries }) => {
        orchestrationEventsState.emit({
          type: 'chat-output',
          processId: chatProcessId,
          payload: {
            chatProcessId,
            entries,
            sessionId,
            // A transcript being READ BACK OFF DISK, never an agent emitting. This flag is the
            // web's only way to tell the two apart: both arrive as chat-output on the same
            // quest subscription, and a browser that treats them alike arms its running
            // indicator once per work item during the subscribe-quest replay — a 31-work-item
            // quest strobed the follow-up composer SEND↔STOP ~35 times in under three seconds
            // with nothing running. Entries still render; only the running state ignores them.
            replay: true,
            ...questIdFragment,
            ...workItemIdFragment,
          },
        });
      },
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message.includes('Guild not found') || error.message.includes('worktree not found'))
    ) {
      throw error;
    }
    // Session JSONL file may not exist — continue to emit chat-history-complete
  }

  if (linked) {
    orchestrationEventsState.emit({
      type: 'quest-session-linked',
      processId: chatProcessId,
      payload: {
        questId: linked.questId,
        chatProcessId,
        ...workItemIdFragment,
        ...roleFragment,
      },
    });
  }

  orchestrationEventsState.emit({
    type: 'chat-history-complete',
    processId: chatProcessId,
    payload: {
      chatProcessId,
      sessionId,
      ...questIdFragment,
      ...workItemIdFragment,
    },
  });
};
