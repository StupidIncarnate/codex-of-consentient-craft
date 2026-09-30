/**
 * PURPOSE: Layer of `quest-monitor-jsonl-watcher-broker` — starts a single `tailFile` on `<projectDir>/subagents/agent-<agentId>.jsonl`, wires the tail's onLine through the shared chat-line processor with `source: 'subagent'`, registers the resulting tail handle in the caller-supplied handles map, and recursively starts tails for any nested sub-agents detected via `agent-detected` outputs. Idempotent: if a tail for `agentId` already exists in the map, the call is a no-op.
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
 * // Returns void; the tail handle lands in `subagentHandles`
 */

import { absoluteFilePathContract, type ChatEntry, type ProcessId } from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';
import { tailFile } from '#gateway/node/fs';
import type { TailFileHandle } from '#gateway/node/fs';
import { stripJsonlSuffixTransformer } from '@dungeonmaster/shared/transformers';

import type { ChatLineProcessor } from '../../../contracts/chat-line-processor/chat-line-processor-contract';
import { chatLineSourceContract } from '../../../contracts/chat-line-source/chat-line-source-contract';
import type { Quest, WorkItem, Agent, Session } from '@dungeonmaster/shared/contracts';

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
  agentId: Agent['id'];
  sessionFilePath: string;
  // The parent session's UUID. Stamped on every emit as `sessionId`
  // so the web binding buckets each sub-agent's entries under the same key that
  // chat-replay-responder uses on the replay path (and that the work item carries as
  // `wi.sessionId`). Without it, live frames land in
  // the binding's SYNTHETIC_SESSION_KEY bucket and the execution row's
  // `sessionEntries.get(wi.sessionId)` lookup returns [] until the user refreshes.
  parentSessionId: Session['id'];
  processor: ChatLineProcessor;
  chatProcessId: ProcessId;
  activeQuestIdGetter: () => Quest['id'] | null;
  // Resolves this sub-agent's owning work item id from its realAgentId. Stamped on every
  // emit as `workItemId` so the web routes the transcript to its own execution row rather
  // than the merged parent-session bucket. Optional: omitted by layer tests; returns null
  // when no active work item currently carries this agentId.
  workItemIdForAgent?: (params: { agentId: Agent['id'] }) => WorkItem['id'] | null;
  emit: (params: {
    chatProcessId: ProcessId;
    entries: ChatEntry[];
    questId: Quest['id'] | null;
    sessionId: Session['id'];
    workItemId?: WorkItem['id'];
  }) => void;
  subagentHandles: Map<Agent['id'], TailFileHandle>;
}): void => {
  if (subagentHandles.has(agentId)) {
    return;
  }

  const sessionFilePathAbsolute = absoluteFilePathContract.parse(String(sessionFilePath));
  const subagentJsonlPath = absoluteFilePathContract.parse(
    `${stripJsonlSuffixTransformer({ filePath: sessionFilePathAbsolute })}/subagents/agent-${String(
      agentId,
    )}.jsonl`,
  );
  const subagentSource = chatLineSourceContract.parse('subagent');

  const handle = tailFile({
    path: subagentJsonlPath,
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
        // Nested sub-agents (B dispatched by A) emit `agent-detected` on the SUB-AGENT tail,
        // not on the main tail. Start a tail for each detected child so its transcript is
        // captured and routed (the shared processor already stamped the parent-chain link
        // via `parentChainMap`, so parentAgentId and ancestor workItemId resolution work).
        if (output.type === 'agent-detected') {
          startSubagentTailLayerBroker({
            agentId: output.agentId,
            sessionFilePath,
            parentSessionId,
            processor,
            chatProcessId,
            activeQuestIdGetter,
            ...(workItemIdForAgent === undefined ? {} : { workItemIdForAgent }),
            emit,
            subagentHandles,
          });
        }
      }
    },
    onError: () => {
      // Tail errors are non-fatal; fs.watch retries on the next change event.
    },
  });
  subagentHandles.set(agentId, handle);
};
