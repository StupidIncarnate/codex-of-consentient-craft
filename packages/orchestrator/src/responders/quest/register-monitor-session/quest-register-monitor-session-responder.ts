/**
 * PURPOSE: Responder for the MCP register-monitor-session tool — registers the /dumpster-launch session, resets orphaned in_progress work items, then starts the JSONL file-watcher so live web-UI chat streams from the launcher's session JSONL plus its sub-agent JSONLs
 *
 * USAGE:
 * const result = await QuestRegisterMonitorSessionResponder({ sessionFilePath });
 * // Returns: { status: 'registered', orphansReset: N }
 *
 * Side effect: starts a long-lived JSONL watcher that emits chat-output events through
 * orchestrationEventsState until the next register-monitor-session call (or server exit).
 * The watcher tags every emitted entry with the currently-active questId via the
 * activeQuestState singleton.
 */

import type { ChatEntry, FilePath, ProcessId, QuestId } from '@dungeonmaster/shared/contracts';
import { processIdContract } from '@dungeonmaster/shared/contracts';

import { questMonitorJsonlWatcherBroker } from '../../../brokers/quest/monitor-jsonl-watcher/quest-monitor-jsonl-watcher-broker';
import { questRegisterMonitorSessionBroker } from '../../../brokers/quest/register-monitor-session/quest-register-monitor-session-broker';
import type { RegisterMonitorSessionResult } from '../../../contracts/register-monitor-session-result/register-monitor-session-result-contract';
import { activeQuestState } from '../../../state/active-quest/active-quest-state';
import { monitorSessionState } from '../../../state/monitor-session/monitor-session-state';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';

// Track the JSONL watcher handle so we can stop the prior tail when (in a future world)
// a new registration replaces it. Today single-launcher semantics reject a second register,
// so the handle effectively lives for the server's lifetime.
let watcherHandle: { stop: () => void } | null = null;

export const QuestRegisterMonitorSessionResponder = async ({
  sessionFilePath,
}: {
  sessionFilePath: FilePath;
}): Promise<RegisterMonitorSessionResult> => {
  const result = await questRegisterMonitorSessionBroker({
    sessionFilePath,
    monitorSession: monitorSessionState,
  });

  // Tear down any prior tail before starting a new one. With the single-launcher guard above
  // this should never fire in practice — but it's a safe no-op when no prior tail exists.
  if (watcherHandle) {
    watcherHandle.stop();
    watcherHandle = null;
  }

  const registered = monitorSessionState.get();
  if (registered === null) {
    // Defensive — broker either threw or returned without registering. Fall through with the
    // ack the broker produced so the caller sees the original error path.
    return result;
  }

  const chatProcessId: ProcessId = processIdContract.parse(`proc-monitor-${crypto.randomUUID()}`);

  watcherHandle = questMonitorJsonlWatcherBroker({
    monitorSession: registered,
    activeQuestIdGetter: (): QuestId | null => activeQuestState.getActive(),
    chatProcessId,
    emit: ({
      chatProcessId: emittedChatProcessId,
      entries,
      questId,
    }: {
      chatProcessId: ProcessId;
      entries: ChatEntry[];
      questId: QuestId | null;
    }): void => {
      orchestrationEventsState.emit({
        type: 'chat-output' as never,
        processId: emittedChatProcessId,
        payload: {
          chatProcessId: emittedChatProcessId,
          entries,
          ...(questId === null ? {} : { questId }),
        },
      });
    },
  });

  return result;
};
