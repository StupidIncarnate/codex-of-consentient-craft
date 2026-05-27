/**
 * PURPOSE: Tails the registered monitor session's main JSONL plus every `subagents/agent-*.jsonl` sibling under `<projectDir>/subagents/`, feeds each line through the existing `chatLineProcessTransformer`, and emits the resulting ChatEntry batches via a caller-supplied `emit` callback. New sub-agent files that appear post-start are picked up via two paths: a 1s poll re-scan of the subagents directory (covers mid-flight Task() dispatches whose parent `user.tool_result` line has not landed yet) and the processor's `agent-detected` outputs (covers Task completion, where the parent line that registers the realAgentId is also when the processor learns the toolUseId↔realAgentId pair).
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
  type ProcessId,
  type QuestId,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';

import { fsWatchTailAdapter } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter';
import { timerSetIntervalAdapter } from '../../../adapters/timer/set-interval/timer-set-interval-adapter';
import type { ActiveMonitorSession } from '../../../contracts/active-monitor-session/active-monitor-session-contract';
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
  monitorSession,
  activeQuestIdGetter,
  chatProcessId,
  emit,
  isAgentIdActive,
}: {
  monitorSession: ActiveMonitorSession;
  activeQuestIdGetter: () => QuestId | null;
  chatProcessId: ProcessId;
  // Emits from sub-agent tails carry `sessionId: parentSessionId` so the web binding
  // buckets them under the same key that `wi.sessionId` resolves to via
  // chat-replay-responder + the MCP get-agent-prompt stamp. Main-session tail emits
  // (the parent /dumpster-launch dispatcher) omit `sessionId` — those frames are
  // dispatcher chatter, not per-row content.
  emit: (params: {
    chatProcessId: ProcessId;
    entries: ChatEntry[];
    questId: QuestId | null;
    sessionId?: SessionId;
  }) => void;
  // Predicate driving the quest-driven subscription: returns true only when the
  // agentId corresponds to an in-progress work item stamped via get-agent-prompt.
  // Stale subagent JSONLs left on disk from prior /dumpster-launch runs return
  // false and are never tailed.
  isAgentIdActive: (params: { agentId: AgentId }) => boolean;
}): { stop: () => void; pruneStaleTails: () => void } => {
  // ONE processor instance is shared across the main JSONL tail AND every sub-agent JSONL
  // tail this broker spawns, mirroring the architecture invariant documented in
  // packages/orchestrator/CLAUDE.md. The processor's realAgentId↔toolUseId reverse map
  // must carry across both sources or sub-agent lines arrive keyed by realAgentId instead
  // of the Task's toolUseId and the web's chain grouping breaks.
  const processor = chatLineProcessTransformer();
  const sessionSource = chatLineSourceContract.parse('session');

  const subagentHandles = new Map<AgentId, ReturnType<typeof fsWatchTailAdapter>>();

  // Initial scan of existing sub-agent JSONL files under
  // `<sessionFilePath without .jsonl>/subagents/`. This is the same layout the replay
  // broker reads — Claude CLI keys sub-agent files by the parent session's path. Files
  // matching `agent-*.jsonl` get a tail each. Missing directory is non-fatal: the poll
  // tick below retries every second, and `agent-detected` from the main tail is a third
  // path that covers the Task-completion window.
  const sessionFilePathAbsolute = absoluteFilePathContract.parse(
    String(monitorSession.sessionFilePath),
  );
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
    sessionFilePath: monitorSession.sessionFilePath,
    parentSessionId,
    processor,
    chatProcessId,
    activeQuestIdGetter,
    emit,
    isAgentIdActive,
    subagentHandles,
  };

  scanSubagentsDirLayerBroker(scanArgs);

  // Periodic re-scan so sub-agent JSONL files created AFTER startup get a tail before the
  // parent's `user.tool_result` line fires `agent-detected`. Real-world flow: /dumpster-launch
  // Task()s pathseeker-surface; Claude CLI starts writing `subagents/agent-<id>.jsonl`
  // immediately; the completion `user.tool_result` only lands minutes later. Without this
  // poll, the sub-agent's live activity is invisible to the web until the user refreshes
  // (replay path reads the full JSONL from disk).
  const pollHandle = timerSetIntervalAdapter({
    callback: (): void => {
      scanSubagentsDirLayerBroker(scanArgs);
    },
    intervalMs: SUBAGENT_DIR_POLL_INTERVAL_MS,
  });

  // Tail the main session JSONL from the beginning. Unlike `chat-main-session-tail-broker`
  // (which uses startPosition: 'end' because stdout streaming already emitted everything),
  // the monitor's main JSONL has never been streamed anywhere — every line is new to the
  // web UI from the moment /dumpster-launch registers.
  const mainJsonlPath = absoluteFilePathContract.parse(String(monitorSession.sessionFilePath));
  const mainHandle = fsWatchTailAdapter({
    filePath: mainJsonlPath,
    onLine: ({ line }) => {
      const parsed = claudeLineNormalizeBroker({ rawLine: line });
      const outputs = processor.processLine({
        parsed,
        source: sessionSource,
      });
      for (const output of outputs) {
        if (output.type === 'entries') {
          if (output.entries.length > 0) {
            emit({ chatProcessId, entries: output.entries, questId: activeQuestIdGetter() });
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
          sessionFilePath: monitorSession.sessionFilePath,
          parentSessionId,
          processor,
          chatProcessId,
          activeQuestIdGetter,
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
