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

export const startSubagentTailLayerBroker = ({
  agentId,
  sessionFilePath,
  parentSessionId,
  processor,
  chatProcessId,
  activeQuestIdGetter,
  workItemIdForAgent,
  emit,
  subagentHandles,
}: {
  agentId: AgentId;
  sessionFilePath: FilePath;
  // The /dumpster-launch parent's session UUID. Stamped on every emit as `sessionId`
  // so the web binding buckets each sub-agent's entries under the same key that
  // chat-replay-responder uses on the replay path (and that get-agent-prompt's
  // modify-quest stamp uses for `wi.sessionId`). Without it, live frames land in
  // the binding's SYNTHETIC_SESSION_KEY bucket and the execution row's
  // `sessionEntries.get(wi.sessionId)` lookup returns [] until the user refreshes.
  parentSessionId: SessionId;
  processor: ChatLineProcessor;
  chatProcessId: ProcessId;
  activeQuestIdGetter: () => QuestId | null;
  // Resolves this sub-agent's owning work item id from its realAgentId. Stamped on every
  // emit as `workItemId` so the web routes the transcript to its own execution row rather
  // than the merged parent-session bucket. Optional: omitted by layer tests; returns null
  // when no active work item currently carries this agentId.
  workItemIdForAgent?: (params: { agentId: AgentId }) => QuestWorkItemId | null;
  emit: (params: {
    chatProcessId: ProcessId;
    entries: ChatEntry[];
    questId: QuestId | null;
    sessionId: SessionId;
    workItemId?: QuestWorkItemId;
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

  const handle = fsWatchTailAdapter({
    filePath: subagentJsonlPath,
    onLine: ({ line }) => {
      const parsed = claudeLineNormalizeBroker({ rawLine: line });
      const outputs = processor.processLine({
        parsed,
        source: subagentSource,
        agentId,
      });
      const workItemId = workItemIdForAgent?.({ agentId }) ?? null;
      for (const output of outputs) {
        if (output.type === 'entries' && output.entries.length > 0) {
          emit({
            chatProcessId,
            entries: output.entries,
            questId: activeQuestIdGetter(),
            sessionId: parentSessionId,
            ...(workItemId === null ? {} : { workItemId }),
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
