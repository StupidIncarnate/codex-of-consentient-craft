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
  type OrchestrationEventType,
  type ProcessId,
  type QuestId,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { claudeProjectPathEncoderTransformer } from '@dungeonmaster/shared/transformers';

import type { AgentId } from '../../../contracts/agent-id/agent-id-contract';
import {
  isoTimestampContract,
  type IsoTimestamp,
} from '../../../contracts/iso-timestamp/iso-timestamp-contract';

import { timerSetIntervalAdapter } from '../../../adapters/timer/set-interval/timer-set-interval-adapter';

const ACTIVE_AGENT_IDS_REFRESH_INTERVAL_MS = 1000;
import { questMonitorJsonlWatcherBroker } from '../monitor-jsonl-watcher/quest-monitor-jsonl-watcher-broker';
import { questOrphanResetBroker } from '../orphan-reset/quest-orphan-reset-broker';
import { refreshActiveAgentIdsLayerBroker } from './refresh-active-agent-ids-layer-broker';

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

  // Quest-driven subscription state: per-quest sets of agentIds currently stamped on
  // in-progress work items. The watcher only tails subagent JSONLs whose agentId is in
  // one of these sets — stale leftover files from prior /dumpster-launch runs never
  // match (their work items are now either pending or terminal, with agentId cleared
  // or pointing to a different file). Populated on startup, refreshed every poll tick.
  const activeAgentIdsByQuest = new Map<QuestId, Set<AgentId>>();
  await refreshActiveAgentIdsLayerBroker({ activeAgentIdsByQuest });

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
      sessionId: emittedSessionId,
    }: {
      chatProcessId: ProcessId;
      entries: ChatEntry[];
      questId: QuestId | null;
      sessionId?: SessionId;
    }): void => {
      emit({
        type: 'chat-output',
        processId: emittedChatProcessId,
        payload: {
          chatProcessId: emittedChatProcessId,
          entries,
          ...(questId === null ? {} : { questId }),
          ...(emittedSessionId === undefined ? {} : { sessionId: emittedSessionId }),
        },
      });
    },
    isAgentIdActive: ({ agentId }: { agentId: AgentId }): boolean => {
      for (const set of activeAgentIdsByQuest.values()) {
        if (set.has(agentId)) return true;
      }
      return false;
    },
  });

  // Periodic refresh keeps the active-agentId set current. Once per second, walk every
  // active quest and rebuild the per-quest agentId Map, then prune tails whose agentId
  // left the set (work item reached terminal). New agentIds added by get-agent-prompt
  // become visible on the very next tick, in time for the JSONL watcher's own poll to
  // start tailing the matching subagent JSONL.
  const refreshHandle = timerSetIntervalAdapter({
    callback: (): void => {
      refreshActiveAgentIdsLayerBroker({ activeAgentIdsByQuest })
        .then((): void => {
          watcherHandle.pruneStaleTails();
        })
        .catch((error: unknown): void => {
          process.stderr.write(
            `[monitor-watcher] active-agent-id refresh failed: ${String(error)}\n`,
          );
        });
    },
    intervalMs: ACTIVE_AGENT_IDS_REFRESH_INTERVAL_MS,
  });

  return {
    stop: (): void => {
      refreshHandle.stop();
      watcherHandle.stop();
      monitorSession.clear();
      activeAgentIdsByQuest.clear();
    },
  };
};
