/**
 * PURPOSE: Tails the registered monitor session's main JSONL plus every `subagents/agent-*.jsonl` sibling under `<projectDir>/subagents/`, feeds each line through the existing `chatLineProcessTransformer`, and emits the resulting ChatEntry batches via a caller-supplied `emit` callback. New sub-agent files that appear post-start are picked up via the processor's `agent-detected` outputs — every parent-line user tool_result registering a realAgentId triggers a fresh per-file tail.
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
  fileNameContract,
  type ChatEntry,
  type ProcessId,
  type QuestId,
  type QuestWorkItemId,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';

import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { fsWatchTailAdapter } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter';
import type { ActiveMonitorSession } from '../../../contracts/active-monitor-session/active-monitor-session-contract';
import type { AgentId } from '../../../contracts/agent-id/agent-id-contract';
import { chatLineSourceContract } from '../../../contracts/chat-line-source/chat-line-source-contract';
import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';
import { stripAgentFilenamePrefixTransformer } from '../../../transformers/strip-agent-filename-prefix/strip-agent-filename-prefix-transformer';
import { stripJsonlSuffixTransformer } from '@dungeonmaster/shared/transformers';

import { startSubagentTailLayerBroker } from './start-subagent-tail-layer-broker';

export const questMonitorJsonlWatcherBroker = ({
  monitorSession,
  activeQuestIdGetter,
  chatProcessId,
  emit,
  onSessionIdLearned,
}: {
  monitorSession: ActiveMonitorSession;
  activeQuestIdGetter: () => QuestId | null;
  chatProcessId: ProcessId;
  emit: (params: {
    chatProcessId: ProcessId;
    entries: ChatEntry[];
    questId: QuestId | null;
  }) => void;
  // Forwarded to every sub-agent tail this broker starts — fires once per sub-agent
  // when the first user-text line carrying the orchestrator's taskPrompt lands. The
  // caller wires this to `questModifyBroker` so the realAgentId is persisted as the
  // matching work item's `sessionId` for downstream history replay.
  onSessionIdLearned?: (params: {
    questId: QuestId;
    workItemId: QuestWorkItemId;
    sessionId: SessionId;
  }) => void;
}): { stop: () => void } => {
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
  // matching `agent-*.jsonl` get a tail each. Missing directory is non-fatal: new
  // sub-agents trigger `agent-detected` on the main tail and start their own tails.
  const sessionFilePathAbsolute = absoluteFilePathContract.parse(
    String(monitorSession.sessionFilePath),
  );
  const subagentsDir = `${stripJsonlSuffixTransformer({ filePath: sessionFilePathAbsolute })}/subagents`;
  try {
    const files = fsReaddirAdapter({ dirPath: subagentsDir });
    for (const file of files) {
      if (!String(file).startsWith('agent-')) continue;
      if (!String(file).endsWith('.jsonl')) continue;
      const agentId = stripAgentFilenamePrefixTransformer({
        fileName: fileNameContract.parse(file),
      });
      startSubagentTailLayerBroker({
        agentId,
        sessionFilePath: monitorSession.sessionFilePath,
        processor,
        chatProcessId,
        activeQuestIdGetter,
        emit,
        ...(onSessionIdLearned === undefined ? {} : { onSessionIdLearned }),
        subagentHandles,
      });
    }
  } catch {
    // subagents/ may not exist yet — agent-detected outputs from the main tail will create
    // per-file tails as new sub-agents come online.
  }

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
        // from a user tool_result. Start tailing the sub-agent JSONL Claude CLI is writing
        // for it. Idempotent via the handles-map membership check in the layer broker.
        startSubagentTailLayerBroker({
          agentId: output.agentId,
          sessionFilePath: monitorSession.sessionFilePath,
          processor,
          chatProcessId,
          activeQuestIdGetter,
          emit,
          ...(onSessionIdLearned === undefined ? {} : { onSessionIdLearned }),
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
      mainHandle.stop();
      for (const handle of subagentHandles.values()) {
        handle.stop();
      }
      subagentHandles.clear();
    },
  };
};
