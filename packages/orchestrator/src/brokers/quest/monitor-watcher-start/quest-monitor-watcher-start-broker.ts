/**
 * PURPOSE: Starts the JSONL watcher against a parent Claude Code session — encodes the JSONL path from projectDir + parentSessionId, runs orphan-reset on the first call per server lifetime, then tails the parent + subagent JSONLs via questMonitorJsonlWatcherBroker. Returns a handle the caller stops when the session is no longer referenced by any active workItem.
 *
 * USAGE:
 * const handle = await questMonitorWatcherStartBroker({
 *   parentSessionId,
 *   projectDir,
 *   emit: ({ type, processId, payload }) => orchestrationEventsState.emit({ type, processId, payload }),
 * });
 * // handle.stop() — tears down the tail
 *
 * WHY emit is a parameter: brokers cannot import from event-bus modules. The responder
 * (server-side) supplies the real `orchestrationEventsState.emit`; tests inject stubs.
 *
 * WHEN-TO-USE: From the quest-driven watcher reactor on the HTTP server when a fresh
 *   `sessionId` is observed on an in-progress workItem in any active quest.
 * WHEN-NOT-TO-USE: Anywhere expecting single-launcher semantics — multiple instances of
 *   this watcher coexist (one per active parent session in the quest graph).
 *
 * `workerWorkItemId` distinguishes the two session kinds this watcher tails: pass it for a
 * top-level node-dispatch worker (its own agent writes the MAIN session — content, not
 * chatter) so the tail uses a `proc-worker-` chatProcessId and stamps the work item on its
 * main-session emits; omit it for a /dumpster-launch dispatcher session, whose main-session
 * lines are chatter that the server's parent-source filter drops. `workerQuestId` names the
 * quest that work item belongs to, so the tail's own terminal event can be routed per-quest.
 */

import { osUserHomedirAdapter } from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  filePathContract,
  processIdContract,
  questIdContract,
  questWorkItemIdContract,
  sessionIdContract,
  type ChatEntry,
  type OrchestrationEventType,
  type ProcessId,
  type QuestId,
  type QuestWorkItemId,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { claudeProjectPathEncoderTransformer } from '@dungeonmaster/shared/transformers';

import type { AgentId } from '../../../contracts/agent-id/agent-id-contract';

import { timerSetIntervalAdapter } from '../../../adapters/timer/set-interval/timer-set-interval-adapter';

const ACTIVE_AGENT_IDS_REFRESH_INTERVAL_MS = 1000;
import { questMonitorJsonlWatcherBroker } from '../monitor-jsonl-watcher/quest-monitor-jsonl-watcher-broker';
import { questOrphanResetBroker } from '../orphan-reset/quest-orphan-reset-broker';
import { refreshActiveAgentIdsLayerBroker } from './refresh-active-agent-ids-layer-broker';

export const questMonitorWatcherStartBroker = async ({
  parentSessionId,
  projectDir,
  emit,
  workerWorkItemId,
  workerQuestId,
}: {
  parentSessionId: string;
  projectDir: string;
  emit: (params: {
    type: OrchestrationEventType;
    processId: ProcessId;
    payload: Record<string, unknown>;
  }) => void;
  // Set when the tailed session is a top-level node-dispatch worker (spawn-batch stamps
  // `sessionId` on the work item but NOT `agentId`). The worker's own output lives in the
  // MAIN session JSONL, so it must NOT be filtered as dispatcher chatter and must route to
  // this work item's execution row. Omitted for /dumpster-launch dispatcher sessions.
  workerWorkItemId?: string;
  // The quest owning `workerWorkItemId`. Carried ONLY so the stop-time terminal event below
  // can be routed by the server's per-quest subscription filter — the per-line chat-output
  // emits deliberately carry no questId (a /dumpster-launch dispatcher session tails
  // sub-agents belonging to several quests at once, so no single id is honest there; the
  // server resolves those from `workItemId`, which a terminal event carrying no entries
  // cannot rely on being cached yet).
  workerQuestId?: string;
}): Promise<{ stop: () => void }> => {
  const homeDir = osUserHomedirAdapter();
  const projectPath = absoluteFilePathContract.parse(projectDir);
  const sessionId = sessionIdContract.parse(parentSessionId);

  // Orphan reset re-runs whenever a parent session is observed — if the prior launcher
  // died mid-flight, in_progress work items still carry the old session's metadata and
  // get-next-step would skip them. We pass `excludeSessionId: sessionId` so the very
  // workItem that triggered this watcher (stamped with parentSessionId by get-agent-prompt
  // moments ago) is preserved — otherwise the reactor falls into a stamp → start → reset
  // → stop oscillation on every dispatch.
  await questOrphanResetBroker({ excludeSessionId: sessionId });

  // Quest-driven subscription state: per-quest sets of agentIds currently stamped on
  // in-progress work items. The watcher only tails subagent JSONLs whose agentId is in
  // one of these sets — stale leftover files from prior runs never match.
  const activeAgentIdsByQuest = new Map<QuestId, Set<AgentId>>();
  // Reverse map rebuilt in lockstep with `activeAgentIdsByQuest` on every refresh: each
  // active sub-agent's realAgentId → its work item id. The watcher reads it to stamp
  // `workItemId` on each sub-agent chat-output emit so the web routes the transcript to
  // its own execution row (sibling sub-agents share the parent sessionId).
  const agentIdToWorkItemId = new Map<AgentId, QuestWorkItemId>();
  await refreshActiveAgentIdsLayerBroker({ activeAgentIdsByQuest, agentIdToWorkItemId });

  const sessionFilePath = claudeProjectPathEncoderTransformer({
    homeDir,
    projectPath,
    sessionId,
  });

  // A top-level node-dispatch worker session uses a `proc-worker-` chatProcessId so the
  // server's parent-source dispatcher-chatter filter (gated on the `proc-monitor-` prefix)
  // leaves its main-session content intact — that content is the worker's actual output,
  // not dispatcher chatter. Dispatcher (/dumpster-launch) sessions keep `proc-monitor-`.
  const mainSessionWorkItemId: QuestWorkItemId | undefined =
    workerWorkItemId === undefined ? undefined : questWorkItemIdContract.parse(workerWorkItemId);
  const mainSessionQuestId: QuestId | undefined =
    workerQuestId === undefined ? undefined : questIdContract.parse(workerQuestId);
  const chatProcessId: ProcessId = processIdContract.parse(
    `${mainSessionWorkItemId === undefined ? 'proc-monitor' : 'proc-worker'}-${parentSessionId}`,
  );
  // Sized 0 (running) or 1 (stopped). The terminal emit below must fire exactly once: the
  // reactor stops a watcher when its work item leaves the active set, and the server-wide
  // teardown stops every watcher it still holds, so both can reach the same handle.
  const stoppedStateSet = new Set<'stopped'>();

  const watcherHandle = questMonitorJsonlWatcherBroker({
    sessionFilePath: filePathContract.parse(String(sessionFilePath)),
    activeQuestIdGetter: (): QuestId | null => null,
    chatProcessId,
    workItemIdForAgent: ({ agentId }: { agentId: AgentId }): QuestWorkItemId | null =>
      agentIdToWorkItemId.get(agentId) ?? null,
    emit: ({
      chatProcessId: emittedChatProcessId,
      entries,
      questId,
      sessionId: emittedSessionId,
      workItemId: emittedWorkItemId,
    }: {
      chatProcessId: ProcessId;
      entries: ChatEntry[];
      questId: QuestId | null;
      sessionId?: SessionId;
      workItemId?: QuestWorkItemId;
    }): void => {
      emit({
        type: 'chat-output',
        processId: emittedChatProcessId,
        payload: {
          chatProcessId: emittedChatProcessId,
          entries,
          ...(questId === null ? {} : { questId }),
          ...(emittedSessionId === undefined ? {} : { sessionId: emittedSessionId }),
          ...(emittedWorkItemId === undefined ? {} : { workItemId: emittedWorkItemId }),
        },
      });
    },
    isAgentIdActive: ({ agentId }: { agentId: AgentId }): boolean => {
      for (const set of activeAgentIdsByQuest.values()) {
        if (set.has(agentId)) return true;
      }
      return false;
    },
    ...(mainSessionWorkItemId === undefined ? {} : { mainSessionWorkItemId }),
  });

  // Periodic refresh keeps the active-agentId set current. Once per second, walk every
  // active quest and rebuild the per-quest agentId Map, then prune tails whose agentId
  // left the set (work item reached terminal). New agentIds added by get-agent-prompt
  // become visible on the very next tick, in time for the JSONL watcher's own poll to
  // start tailing the matching subagent JSONL.
  const refreshHandle = timerSetIntervalAdapter({
    callback: (): void => {
      refreshActiveAgentIdsLayerBroker({ activeAgentIdsByQuest, agentIdToWorkItemId })
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
      activeAgentIdsByQuest.clear();
      if (stoppedStateSet.has('stopped')) return;
      stoppedStateSet.add('stopped');
      // A tail is a delivery identity, and every delivery identity on the wire owes the web a
      // terminal event: `chat-output` naming a chatProcessId is what arms the composer's
      // running indicator, and only a `chat-complete` naming that same id disarms it. A chat
      // turn is delivered by TWO identities — the spawn's own stdout and this tail over the
      // session JSONL the same child writes — and the spawn's `chat-complete` speaks only for
      // itself, so without this the tail's post-exit drain re-arms a turn that has already
      // ended and nothing is left to clear it: the composer holds STOP forever and the user
      // cannot send again. Scoped to a worker tail because that is the one shape with a single
      // owning work item + quest to name; a dispatcher session serves several quests at once.
      if (mainSessionWorkItemId === undefined || mainSessionQuestId === undefined) return;
      emit({
        type: 'chat-complete',
        processId: chatProcessId,
        payload: {
          chatProcessId,
          sessionId,
          questId: mainSessionQuestId,
          workItemId: mainSessionWorkItemId,
        },
      });
    },
  };
};
