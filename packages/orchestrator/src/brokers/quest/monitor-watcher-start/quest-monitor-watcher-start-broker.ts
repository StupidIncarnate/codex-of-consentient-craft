/**
 * PURPOSE: Starts the /dumpster-launch JSONL watcher against the announced parent session — encodes the JSONL path from projectDir + parentSessionId, runs orphan-reset, registers the session via the caller-supplied monitorSession facade, then tails the parent + subagent JSONLs via questMonitorJsonlWatcherBroker. Returns a handle the caller stops when the session changes or is removed.
 *
 * USAGE:
 * const handle = await questMonitorWatcherStartBroker({
 *   parentSessionId,
 *   projectDir,
 *   monitorSession: monitorSessionState,
 *   emit: ({ type, processId, payload }) => orchestrationEventsState.emit({ type, processId, payload }),
 * });
 * // handle.stop() — tears down the tail and clears monitorSession
 *
 * WHY monitorSession + emit are parameters: brokers cannot import from state/ or event-bus
 * modules. The responder (server-side) supplies the real `monitorSessionState` methods and
 * `orchestrationEventsState.emit`; tests inject stubs.
 *
 * WHEN-TO-USE: From the HTTP server's monitor-session-watch reactor when a new
 *   `active-monitor-session.json` parentSessionId is observed.
 * WHEN-NOT-TO-USE: Anywhere needing the watcher mid-flight without orphan-reset — call
 *   `questMonitorJsonlWatcherBroker` directly instead.
 */

import { osUserHomedirAdapter } from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  filePathContract,
  processIdContract,
  sessionIdContract,
  type ChatEntry,
  type FilePath,
  type ModifyQuestInput,
  type OrchestrationEventType,
  type ProcessId,
  type QuestId,
} from '@dungeonmaster/shared/contracts';
import { claudeProjectPathEncoderTransformer } from '@dungeonmaster/shared/transformers';

import {
  isoTimestampContract,
  type IsoTimestamp,
} from '../../../contracts/iso-timestamp/iso-timestamp-contract';

import { questModifyBroker } from '../modify/quest-modify-broker';
import { questMonitorJsonlWatcherBroker } from '../monitor-jsonl-watcher/quest-monitor-jsonl-watcher-broker';
import { questOrphanResetBroker } from '../orphan-reset/quest-orphan-reset-broker';

export const questMonitorWatcherStartBroker = async ({
  parentSessionId,
  projectDir,
  monitorSession,
  emit,
}: {
  parentSessionId: string;
  projectDir: string;
  monitorSession: {
    clear: () => void;
    register: (params: {
      projectDir: FilePath;
      sessionFilePath: FilePath;
      registeredAt: IsoTimestamp;
    }) => void;
    get: () => {
      projectDir: FilePath;
      sessionFilePath: FilePath;
      registeredAt: IsoTimestamp;
    } | null;
  };
  emit: (params: {
    type: OrchestrationEventType;
    processId: ProcessId;
    payload: Record<string, unknown>;
  }) => void;
}): Promise<{ stop: () => void }> => {
  // Re-run the orphan reset every time a new session is announced. If the prior launcher
  // died mid-flight, in_progress work items still carry the old session's metadata and
  // get-next-step would skip them; resetting back to pending is what restores dispatch.
  await questOrphanResetBroker();

  const homeDir = osUserHomedirAdapter();
  const projectPath = absoluteFilePathContract.parse(projectDir);
  const sessionId = sessionIdContract.parse(parentSessionId);

  const sessionFilePath = claudeProjectPathEncoderTransformer({
    homeDir,
    projectPath,
    sessionId,
  });

  // Record the session in the caller's monitorSession facade. The reactor owns the
  // single-launcher semantics (it stops the prior watcher BEFORE starting this one) so
  // we don't enforce single-launcher here — clear THEN register.
  monitorSession.clear();
  monitorSession.register({
    projectDir: filePathContract.parse(projectDir),
    sessionFilePath: filePathContract.parse(String(sessionFilePath)),
    registeredAt: isoTimestampContract.parse(new Date().toISOString()),
  });

  const registered = monitorSession.get();
  if (registered === null) {
    // monitorSession.register parses through activeMonitorSessionContract; reaching null
    // means the contract rejected the input. Surface the failure to the caller.
    throw new Error('Failed to register monitor session — register returned null');
  }

  const chatProcessId: ProcessId = processIdContract.parse(`proc-monitor-${parentSessionId}`);

  const watcherHandle = questMonitorJsonlWatcherBroker({
    monitorSession: registered,
    activeQuestIdGetter: (): QuestId | null => null,
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
      emit({
        type: 'chat-output',
        processId: emittedChatProcessId,
        payload: {
          chatProcessId: emittedChatProcessId,
          entries,
          ...(questId === null ? {} : { questId }),
        },
      });
    },
    // Fires once per Task-dispatched sub-agent when its first user-text line lands
    // carrying the orchestrator's taskPrompt. Persisting the realAgentId as the work
    // item's `sessionId` lets the per-work-item history panel resolve which
    // `subagents/agent-<id>.jsonl` to replay. Mirrors the chaos-spawn pattern at
    // packages/orchestrator/src/brokers/chat/spawn/chat-spawn-broker.ts (onSessionId).
    onSessionIdLearned: ({ questId, workItemId, sessionId: learnedSessionId }) => {
      questModifyBroker({
        input: {
          questId,
          workItems: [{ id: workItemId, sessionId: learnedSessionId }],
        } as ModifyQuestInput,
      }).catch((error: unknown) => {
        process.stderr.write(`[monitor-watcher] session-id stamp failed: ${String(error)}\n`);
      });
    },
  });

  return {
    stop: (): void => {
      watcherHandle.stop();
      monitorSession.clear();
    },
  };
};
