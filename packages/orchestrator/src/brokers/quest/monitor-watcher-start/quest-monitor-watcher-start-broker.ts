/**
 * PURPOSE: Starts the JSONL watcher against a Node-dispatch worker's own session — encodes
 * the JSONL path from projectDir + parentSessionId, runs orphan-reset on the first call per
 * server lifetime, then tails the session + its subagent JSONLs via
 * questMonitorJsonlWatcherBroker. Returns a handle the caller stops when the session is no
 * longer referenced by any active workItem.
 *
 * USAGE:
 * const handle = await questMonitorWatcherStartBroker({
 *   parentSessionId,
 *   projectDir,
 *   workerWorkItemId,
 *   workerQuestId,
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
 * Every tailed session is a Node-dispatch worker's own dedicated session: `workerWorkItemId`
 * names the work item whose agent writes the MAIN session JSONL (content, not chatter), and
 * the tail uses a `proc-worker-` chatProcessId and stamps that work item on its main-session
 * emits. `workerQuestId` names the quest that work item belongs to, so the tail's own
 * terminal event can be routed per-quest.
 */

import type { WorkItem, Quest } from '@dungeonmaster/shared/contracts';
import { homedir } from '#gateway/node/os';
import { absoluteFilePathContract, filePathContract, processIdContract, questWorkItemIdContract, sessionIdContract, type ChatEntry, type OrchestrationEventType, type ProcessId, type QuestWorkItemId, type SessionId, questContract } from '@dungeonmaster/shared/contracts';
import { claudeProjectPathEncoderTransformer } from '@dungeonmaster/shared/transformers';

import { questMonitorJsonlWatcherBroker } from '../monitor-jsonl-watcher/quest-monitor-jsonl-watcher-broker';
import { questOrphanResetBroker } from '../orphan-reset/quest-orphan-reset-broker';

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
  // The work item whose agent writes this session's MAIN JSONL — its own output, not
  // chatter. Names the tail's `proc-worker-` chatProcessId and is stamped on every
  // main-session emit so the web routes them to this work item's execution row.
  workerWorkItemId: WorkItem['id'];
  // The quest owning `workerWorkItemId`, so the tail's stop-time terminal event can be
  // routed by the server's per-quest subscription filter.
  workerQuestId: Quest['id'];
}): Promise<{ stop: () => void }> => {
  const homeDir = absoluteFilePathContract.parse(homedir());
  const projectPath = absoluteFilePathContract.parse(projectDir);
  const sessionId = sessionIdContract.parse(parentSessionId);

  // Resolved BEFORE the orphan reset below, which needs it as an exclusion key.
  const mainSessionWorkItemId: QuestWorkItemId = questWorkItemIdContract.parse(workerWorkItemId);
  const mainSessionQuestId: Quest['id'] = questContract.shape.id.parse(workerQuestId);

  // Orphan reset re-runs whenever a session is observed — if the prior dispatch died
  // mid-flight, in_progress work items still carry the old session's metadata and
  // get-next-step would skip them. We pass `excludeSessionId: sessionId` so the very
  // workItem that triggered this watcher (just stamped with this sessionId) is preserved —
  // otherwise the reactor falls into a stamp → start → reset → stop oscillation on every
  // dispatch.
  //
  // `excludeWorkItemId` protects the SAME item by an id that cannot move under the sweep's
  // feet. A node-dispatch worker is dispatched under whatever sessionId its work item already
  // carried — a RESUMED item carries the retained one — and then the child's init line
  // re-stamps the item with the session Claude CLI minted for this run. The reactor started
  // this watcher for the id it saw first, so a sessionId-only exclusion stops matching the
  // moment the re-stamp lands, and the sweep resets an agent that is still running. The whole
  // reason that window is wide enough to lose is the walk under `FRESHNESS` in the reset
  // broker: it reads every quest.json under the home, so it grows with everything ever left
  // there.
  await questOrphanResetBroker({
    excludeSessionId: sessionId,
    excludeWorkItemId: mainSessionWorkItemId,
  });

  const sessionFilePath = claudeProjectPathEncoderTransformer({
    homeDir,
    projectPath,
    sessionId,
  });

  const chatProcessId: ProcessId = processIdContract.parse(`proc-worker-${parentSessionId}`);
  // Sized 0 (running) or 1 (stopped). The terminal emit below must fire exactly once: the
  // reactor stops a watcher when its work item leaves the active set, and the server-wide
  // teardown stops every watcher it still holds, so both can reach the same handle.
  const stoppedStateSet = new Set<'stopped'>();

  const watcherHandle = questMonitorJsonlWatcherBroker({
    sessionFilePath: filePathContract.parse(String(sessionFilePath)),
    activeQuestIdGetter: (): Quest['id'] | null => null,
    chatProcessId,
    // A sub-agent that carries no work item of its own — a parent-summoned minion, or a
    // Task-dispatched helper — still belongs to the work item whose session spawned it.
    // Falling back to that owner is what lets the relay name a quest for the emit; without
    // it the frame is attributable to nobody, and a frame with no owner cannot be delivered
    // to one quest's subscribers rather than all of them.
    workItemIdForAgent: (): QuestWorkItemId => mainSessionWorkItemId,
    emit: ({
      chatProcessId: emittedChatProcessId,
      entries,
      questId,
      sessionId: emittedSessionId,
      workItemId: emittedWorkItemId,
    }: {
      chatProcessId: ProcessId;
      entries: ChatEntry[];
      questId: Quest['id'] | null;
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
    mainSessionWorkItemId,
  });

  return {
    stop: (): void => {
      watcherHandle.stop();
      if (stoppedStateSet.has('stopped')) return;
      stoppedStateSet.add('stopped');
      // A tail is a delivery identity, and every delivery identity on the wire owes the web a
      // terminal event: `chat-output` naming a chatProcessId is what arms the composer's
      // running indicator, and only a `chat-complete` naming that same id disarms it. A chat
      // turn is delivered by TWO identities — the spawn's own stdout and this tail over the
      // session JSONL the same child writes — and the spawn's `chat-complete` speaks only for
      // itself, so without this the tail's post-exit drain re-arms a turn that has already
      // ended and nothing is left to clear it: the composer holds STOP forever and the user
      // cannot send again.
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
