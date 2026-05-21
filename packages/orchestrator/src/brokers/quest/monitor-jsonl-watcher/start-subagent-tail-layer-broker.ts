/**
 * PURPOSE: Layer of `quest-monitor-jsonl-watcher-broker` — starts a single `fsWatchTailAdapter` on `<projectDir>/subagents/agent-<agentId>.jsonl`, wires the tail's onLine through the shared chat-line processor with `source: 'subagent'`, and registers the resulting tail handle in the caller-supplied handles map. Idempotent: if a tail for `agentId` already exists in the map, the call is a no-op.
 *
 * USAGE:
 * startSubagentTailLayerBroker({
 *   agentId,
 *   sessionFilePath,
 *   processor,
 *   chatProcessId,
 *   activeQuestIdGetter,
 *   emit,
 *   subagentHandles,
 * });
 * // Returns AdapterResult { success: true }
 */

import {
  absoluteFilePathContract,
  adapterResultContract,
  sessionIdContract,
  type AdapterResult,
  type ChatEntry,
  type FilePath,
  type ProcessId,
  type QuestId,
  type QuestWorkItemId,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';
import { stripJsonlSuffixTransformer } from '@dungeonmaster/shared/transformers';

import { fsWatchTailAdapter } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter';
import type { AgentId } from '../../../contracts/agent-id/agent-id-contract';
import type { ChatLineProcessor } from '../../../contracts/chat-line-processor/chat-line-processor-contract';
import { chatLineSourceContract } from '../../../contracts/chat-line-source/chat-line-source-contract';
import { taskPromptIdsExtractorTransformer } from '../../../transformers/task-prompt-ids-extractor/task-prompt-ids-extractor-transformer';

export const startSubagentTailLayerBroker = ({
  agentId,
  sessionFilePath,
  processor,
  chatProcessId,
  activeQuestIdGetter,
  emit,
  onSessionIdLearned,
  subagentHandles,
}: {
  agentId: AgentId;
  sessionFilePath: FilePath;
  processor: ChatLineProcessor;
  chatProcessId: ProcessId;
  activeQuestIdGetter: () => QuestId | null;
  emit: (params: {
    chatProcessId: ProcessId;
    entries: ChatEntry[];
    questId: QuestId | null;
  }) => void;
  // Fires once when the sub-agent's first user-text line lands — that line carries
  // the parent's `Task.input.prompt` verbatim, which embeds `workItemId: "<uuid>"` and
  // `questId: "<uuid>"`. The realAgentId (= filename, = `agentId` param) is the
  // per-sub-agent unique identifier and is what gets stamped onto
  // `quest.workItems[workItemId].sessionId` so per-work-item history replay can find
  // the matching `subagents/agent-<sessionId>.jsonl`.
  onSessionIdLearned?: (params: {
    questId: QuestId;
    workItemId: QuestWorkItemId;
    sessionId: SessionId;
  }) => void;
  subagentHandles: Map<AgentId, ReturnType<typeof fsWatchTailAdapter>>;
}): AdapterResult => {
  if (subagentHandles.has(agentId)) {
    return adapterResultContract.parse({ success: true });
  }

  const sessionFilePathAbsolute = absoluteFilePathContract.parse(String(sessionFilePath));
  const subagentJsonlPath = absoluteFilePathContract.parse(
    `${stripJsonlSuffixTransformer({ filePath: sessionFilePathAbsolute })}/subagents/agent-${String(
      agentId,
    )}.jsonl`,
  );
  const subagentSource = chatLineSourceContract.parse('subagent');

  let sessionIdReported = false;

  const handle = fsWatchTailAdapter({
    filePath: subagentJsonlPath,
    onLine: ({ line }) => {
      const parsed = claudeLineNormalizeBroker({ rawLine: line });
      const outputs = processor.processLine({
        parsed,
        source: subagentSource,
        agentId,
      });
      for (const output of outputs) {
        if (output.type === 'entries' && output.entries.length > 0) {
          emit({ chatProcessId, entries: output.entries, questId: activeQuestIdGetter() });
        }
      }

      if (!sessionIdReported && onSessionIdLearned !== undefined) {
        const ids = taskPromptIdsExtractorTransformer({ parsed });
        if (ids !== null) {
          sessionIdReported = true;
          onSessionIdLearned({
            questId: ids.questId,
            workItemId: ids.workItemId,
            sessionId: sessionIdContract.parse(String(agentId)),
          });
        }
      }
    },
    onError: () => {
      // Tail errors are non-fatal; fs.watch retries on the next change event.
    },
  });
  subagentHandles.set(agentId, handle);
  return adapterResultContract.parse({ success: true });
};
