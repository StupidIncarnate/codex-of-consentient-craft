/**
 * PURPOSE: Tails the registered monitor session's main JSONL plus every `subagents/agent-*.jsonl` sibling under `<projectDir>/subagents/`, feeds each line through the existing `chatLineProcessTransformer`, and emits the resulting ChatEntry batches via a caller-supplied `emit` callback. New sub-agent files that appear post-start are picked up via two paths: a 1s poll re-scan of the subagents directory (covers mid-flight Task() dispatches whose parent `user.tool_result` line has not landed yet) and the processor's `agent-detected` outputs (covers Task completion, where the parent line that registers the realAgentId is also when the processor learns the toolUseId↔realAgentId pair). Nested sub-agents (spawned by a sub-agent rather than the main session) are routed to the nearest ancestor work item by walking the processor's parent-chain maps via `resolveParentRealAgentId`.
 *
 * USAGE:
 * const handle = questMonitorJsonlWatcherBroker({
 *   monitorSession: { projectDir, sessionFilePath, registeredAt },
 *   activeQuestIdGetter: () => null,
 *   chatProcessId,
 *   emit: ({ chatProcessId, entries }) => orchestrationEventsState.emit({ ... }),
 * });
 * handle.stop();
 *
 * WHY caller injects emit + activeQuestIdGetter: brokers cannot import from event-bus
 * modules. The HTTP server reactor that wires this broker supplies the real
 * `orchestrationEventsState.emit`. The `activeQuestIdGetter` parameter is retained for
 * back-compat with existing tests; under the auto-monitor model it always returns null
 * and the broadcaster derives questId from each entry's workItemId at delivery time.
 */

import {
  absoluteFilePathContract,
  sessionIdContract,
  type ChatEntry,
  type FilePath,
  type ProcessId,
  type QuestId,
  type QuestWorkItemId,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';

import { fsWatchTailAdapter } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter';
import { timerSetIntervalAdapter } from '../../../adapters/timer/set-interval/timer-set-interval-adapter';
import type { AgentId } from '../../../contracts/agent-id/agent-id-contract';
import { chatLineSourceContract } from '../../../contracts/chat-line-source/chat-line-source-contract';
import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';
import { stripJsonlSuffixTransformer } from '@dungeonmaster/shared/transformers';

import { scanSubagentsDirLayerBroker } from './scan-subagents-dir-layer-broker';
import { startSubagentTailLayerBroker } from './start-subagent-tail-layer-broker';

// How often the broker re-scans `<sessionFilePath without .jsonl>/subagents/` for newly-
// created `agent-*.jsonl` files. The `agent-detected` signal from the processor only fires
// when the parent's `user.tool_result` line is observed (i.e. Task completion). Without
// this poll, sub-agent JSONLs written DURING a mid-flight Task have no live tail watching
// them and their content is invisible to the web until the user refreshes (replay path).
// 1000ms keeps the live-streaming feel without spamming the filesystem.
const SUBAGENT_DIR_POLL_INTERVAL_MS = 1000;

export const questMonitorJsonlWatcherBroker = ({
  sessionFilePath,
  activeQuestIdGetter,
  chatProcessId,
  workItemIdForAgent,
  emit,
  isAgentIdActive,
  mainSessionWorkItemId,
}: {
  sessionFilePath: FilePath;
  activeQuestIdGetter: () => QuestId | null;
  // Resolves the owning work item id for a sub-agent's realAgentId. Forwarded to each
  // sub-agent tail so its emits carry `workItemId`, letting the web route the transcript
  // to its own execution row instead of the merged parent-session bucket. A null OR
  // undefined return both mean "no work item for this agent". Optional: omitted by tests.
  workItemIdForAgent?: (params: { agentId: AgentId }) => QuestWorkItemId | null | undefined;
  chatProcessId: ProcessId;
  // Emits from sub-agent tails carry `sessionId: parentSessionId` so the web binding
  // buckets them under the same key that `wi.sessionId` resolves to via
  // chat-replay-responder + the MCP get-agent-prompt stamp. Main-session tail emits
  // for a /dumpster-launch DISPATCHER session omit `sessionId` — those frames are
  // dispatcher chatter, not per-row content. For a node-dispatch WORKER session (see
  // `mainSessionWorkItemId` below) the main session IS the per-row content, so those
  // emits DO carry `sessionId` + `workItemId`.
  emit: (params: {
    chatProcessId: ProcessId;
    entries: ChatEntry[];
    questId: QuestId | null;
    sessionId?: SessionId;
    workItemId?: QuestWorkItemId;
  }) => void;
  // Predicate driving the quest-driven subscription: returns true only when the
  // agentId corresponds to an in-progress work item stamped via get-agent-prompt.
  // Stale subagent JSONLs left on disk from prior /dumpster-launch runs return
  // false and are never tailed.
  isAgentIdActive: (params: { agentId: AgentId }) => boolean;
  // Set when the tailed session is a top-level node-dispatch worker: its own agent
  // (pathseeker/codeweaver/…) writes its work to the MAIN session JSONL — there is no
  // dispatcher above it. Main-session tail emits then carry `sessionId: parentSessionId`
  // + this `workItemId`, so the web routes them to the worker's execution row exactly as
  // the replay path does. Omitted for /dumpster-launch dispatcher sessions, whose
  // main-session lines are dispatcher chatter dropped by the server's parent-source filter.
  mainSessionWorkItemId?: QuestWorkItemId;
}): { stop: () => void; pruneStaleTails: () => void } => {
  // ONE processor instance is shared across the main JSONL tail AND every sub-agent JSONL
  // tail this broker spawns, mirroring the architecture invariant documented in
  // packages/orchestrator/CLAUDE.md. The processor's realAgentId↔toolUseId reverse map
  // must carry across both sources or sub-agent lines arrive keyed by realAgentId instead
  // of the Task's toolUseId and the web's chain grouping breaks.
  const processor = chatLineProcessTransformer();

  // A nested sub-agent has no work item of its own. Route its transcript to the nearest
  // ancestor work item by walking realChild -> realParent (via the processor's chain maps)
  // until workItemIdForAgent resolves a non-null id. Depth-1 sub-agents resolve on the first
  // hop; top-level (no ancestor work item) resolve to null and emit without a workItemId.
  const resolveAncestorWorkItemId:
    | ((params: { agentId: AgentId }) => QuestWorkItemId | null)
    | undefined =
    workItemIdForAgent === undefined
      ? undefined
      : ({ agentId }: { agentId: AgentId }): QuestWorkItemId | null => {
          const direct = workItemIdForAgent({ agentId });
          if (direct !== null && direct !== undefined) return direct;
          const parentReal = processor.resolveParentRealAgentId({ agentId });
          // resolveAncestorWorkItemId is always defined here (we are inside it); the guard
          // only narrows its optional declared type so the recursive call type-checks.
          if (parentReal === undefined || resolveAncestorWorkItemId === undefined) return null;
          return resolveAncestorWorkItemId({ agentId: parentReal });
        };

  const sessionSource = chatLineSourceContract.parse('session');

  const subagentHandles = new Map<AgentId, ReturnType<typeof fsWatchTailAdapter>>();

  // Initial scan of existing sub-agent JSONL files under
  // `<sessionFilePath without .jsonl>/subagents/`. This is the same layout the replay
  // broker reads — Claude CLI keys sub-agent files by the parent session's path. Files
  // matching `agent-*.jsonl` get a tail each. Missing directory is non-fatal: the poll
  // tick below retries every second, and `agent-detected` from the main tail is a third
  // path that covers the Task-completion window.
  const sessionFilePathAbsolute = absoluteFilePathContract.parse(String(sessionFilePath));
  const sessionFileNoSuffix = stripJsonlSuffixTransformer({ filePath: sessionFilePathAbsolute });
  const subagentsDir = `${sessionFileNoSuffix}/subagents`;
  // The parent /dumpster-launch session UUID — the basename of the session JSONL minus
  // `.jsonl`. Forwarded to every sub-agent tail so each emit carries `sessionId:
  // parentSessionId`, matching what `wi.sessionId` is stamped to by the MCP
  // get-agent-prompt handler (interaction-handle-responder) and what chat-replay-responder
  // emits on the replay path. Keeps the web binding's bucket key in lockstep across
  // streaming + replay.
  const lastSlash = sessionFileNoSuffix.lastIndexOf('/');
  const parentSessionId = sessionIdContract.parse(
    lastSlash === -1 ? sessionFileNoSuffix : sessionFileNoSuffix.slice(lastSlash + 1),
  );
  const scanArgs = {
    subagentsDir,
    sessionFilePath,
    parentSessionId,
    processor,
    chatProcessId,
    activeQuestIdGetter,
    ...(resolveAncestorWorkItemId === undefined
      ? {}
      : { workItemIdForAgent: resolveAncestorWorkItemId }),
    emit,
    isAgentIdActive,
    subagentHandles,
  };

  // Fire-and-forget: the scan tails active sub-agents synchronously (before its first await)
  // and prompt-pairs non-active nested sub-agents asynchronously; the watcher does not await it.
  scanSubagentsDirLayerBroker(scanArgs).catch((error: unknown) => {
    process.stderr.write(`[monitor-watcher] subagent scan failed: ${String(error)}\n`);
  });

  // Periodic re-scan so sub-agent JSONL files created AFTER startup get a tail before the
  // parent's `user.tool_result` line fires `agent-detected`. Real-world flow: /dumpster-launch
  // Task()s pathseeker-surface; Claude CLI starts writing `subagents/agent-<id>.jsonl`
  // immediately; the completion `user.tool_result` only lands minutes later. Without this
  // poll, the sub-agent's live activity is invisible to the web until the user refreshes
  // (replay path reads the full JSONL from disk). The poll also re-reads not-yet-paired
  // nested sub-agent files until their spawning Task is observed.
  const pollHandle = timerSetIntervalAdapter({
    callback: (): void => {
      scanSubagentsDirLayerBroker(scanArgs).catch((error: unknown) => {
        process.stderr.write(`[monitor-watcher] subagent scan failed: ${String(error)}\n`);
      });
    },
    intervalMs: SUBAGENT_DIR_POLL_INTERVAL_MS,
  });

  // Tail the main session JSONL from the beginning. Unlike `chat-main-session-tail-broker`
  // (which uses startPosition: 'end' because stdout streaming already emitted everything),
  // the monitor's main JSONL has never been streamed anywhere — every line is new to the
  // web UI from the moment /dumpster-launch registers.
  const mainJsonlPath = absoluteFilePathContract.parse(String(sessionFilePath));
  const mainHandle = fsWatchTailAdapter({
    filePath: mainJsonlPath,
    // The session JSONL may not exist yet: a node-dispatch worker's sessionId reaches the
    // reactor via the child's stdout init line and starts this tail a beat before Claude CLI
    // flushes `<sessionId>.jsonl` to disk. `awaitCreate` watches the parent dir until the
    // file appears instead of stranding a dead tail on the ENOENT no-op path.
    awaitCreate: true,
    onLine: ({ line }) => {
      const parsed = claudeLineNormalizeBroker({ rawLine: line });
      const outputs = processor.processLine({
        parsed,
        source: sessionSource,
      });
      for (const output of outputs) {
        if (output.type === 'entries') {
          if (output.entries.length > 0) {
            emit({
              chatProcessId,
              entries: output.entries,
              questId: activeQuestIdGetter(),
              // Worker session: stamp sessionId + workItemId so the web routes the main
              // session's own transcript to the worker's execution row. Dispatcher session:
              // omit both — these are filtered as parent-source chatter server-side.
              ...(mainSessionWorkItemId === undefined
                ? {}
                : { sessionId: parentSessionId, workItemId: mainSessionWorkItemId }),
            });
          }
          continue;
        }
        // `agent-detected` — the processor learned a new realAgentId↔toolUseId mapping
        // from a user tool_result. Start tailing only if the agentId is recorded on
        // a current in-progress work item; stale leftovers are skipped.
        if (!isAgentIdActive({ agentId: output.agentId })) {
          continue;
        }
        startSubagentTailLayerBroker({
          agentId: output.agentId,
          sessionFilePath,
          parentSessionId,
          processor,
          chatProcessId,
          activeQuestIdGetter,
          ...(resolveAncestorWorkItemId === undefined
            ? {}
            : { workItemIdForAgent: resolveAncestorWorkItemId }),
          emit,
          subagentHandles,
        });
      }
    },
    onError: () => {
      // Non-fatal — the watcher retries on the next change event.
    },
  });

  return {
    stop: (): void => {
      pollHandle.stop();
      mainHandle.stop();
      for (const handle of subagentHandles.values()) {
        handle.stop();
      }
      subagentHandles.clear();
    },
    // Stops any tail whose agentId is no longer in the active set. Caller invokes
    // this after refreshing the active-agentId state in response to a quest-modified
    // outbox event — when a work item transitions to a terminal status, the
    // corresponding tail can release its fs handle.
    pruneStaleTails: (): void => {
      for (const [agentId, handle] of subagentHandles) {
        if (!isAgentIdActive({ agentId })) {
          handle.stop();
          subagentHandles.delete(agentId);
        }
      }
    },
  };
};
