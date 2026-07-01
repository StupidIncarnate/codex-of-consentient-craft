/**
 * PURPOSE: Layer of `quest-monitor-jsonl-watcher-broker` — reads the parent session's `subagents/` directory and starts a tail for every `agent-*.jsonl` file that belongs to the live run. ACTIVE files (whose agentId is stamped on an in-progress work item per `isAgentIdActive`) tail directly. NON-active files are either a nested sub-agent (spawned by a sub-agent, so it never gets its own work item) or a stale leftover from a prior run; the broker reads the file's first line — Claude CLI writes the spawning Task's prompt there verbatim — and pairs it against the processor's outstanding Tasks. A match registers the correlation and tails the nested sub-agent live (so it streams BEFORE finishing); a stale file matches nothing and stays skipped. ENOENT and other readdir failures are silently swallowed (the directory may not exist yet during fresh sessions). Idempotent: re-invoking on every poll tick is safe (already-tailed files are skipped).
 *
 * USAGE:
 * await scanSubagentsDirLayerBroker({
 *   subagentsDir,
 *   sessionFilePath,
 *   parentSessionId,
 *   processor,
 *   chatProcessId,
 *   activeQuestIdGetter,
 *   emit,
 *   isAgentIdActive,
 *   subagentHandles,
 * });
 * // Returns AdapterResult { success: true }
 */

import {
  absoluteFilePathContract,
  adapterResultContract,
  fileNameContract,
  type AdapterResult,
  type ChatEntry,
  type FileName,
  type FilePath,
  type ProcessId,
  type QuestId,
  type QuestWorkItemId,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';

import { fsReadJsonlAdapter } from '../../../adapters/fs/read-jsonl/fs-read-jsonl-adapter';
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import type { fsWatchTailAdapter } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter';
import type { AgentId } from '../../../contracts/agent-id/agent-id-contract';
import type { ChatLineProcessor } from '../../../contracts/chat-line-processor/chat-line-processor-contract';
import { normalizedStreamLineContract } from '../../../contracts/normalized-stream-line/normalized-stream-line-contract';
import { taskAgentToolPromptContract } from '../../../contracts/task-agent-tool-prompt/task-agent-tool-prompt-contract';
import { stripAgentFilenamePrefixTransformer } from '../../../transformers/strip-agent-filename-prefix/strip-agent-filename-prefix-transformer';

import { startSubagentTailLayerBroker } from './start-subagent-tail-layer-broker';

export const scanSubagentsDirLayerBroker = async ({
  subagentsDir,
  sessionFilePath,
  parentSessionId,
  processor,
  chatProcessId,
  activeQuestIdGetter,
  workItemIdForAgent,
  emit,
  isAgentIdActive,
  subagentHandles,
}: {
  subagentsDir: string;
  sessionFilePath: FilePath;
  parentSessionId: SessionId;
  processor: ChatLineProcessor;
  chatProcessId: ProcessId;
  activeQuestIdGetter: () => QuestId | null;
  // Forwarded to each sub-agent tail so its emits carry the owning `workItemId`. Optional:
  // omitted by layer tests.
  workItemIdForAgent?: (params: { agentId: AgentId }) => QuestWorkItemId | null;
  emit: (params: {
    chatProcessId: ProcessId;
    entries: ChatEntry[];
    questId: QuestId | null;
    sessionId: SessionId;
    workItemId?: QuestWorkItemId;
  }) => void;
  // Returns true iff a file's agentId matches an in-progress work item stamped via
  // get-agent-prompt. Such files tail directly. Non-active files fall through to the
  // prompt-pairing path so a nested sub-agent (no work item of its own) is still tailed.
  isAgentIdActive: (params: { agentId: AgentId }) => boolean;
  subagentHandles: Map<AgentId, ReturnType<typeof fsWatchTailAdapter>>;
}): Promise<AdapterResult> => {
  const tailArgs = {
    sessionFilePath,
    parentSessionId,
    processor,
    chatProcessId,
    activeQuestIdGetter,
    ...(workItemIdForAgent === undefined ? {} : { workItemIdForAgent }),
    emit,
    subagentHandles,
  };

  // PHASE 1 (synchronous, before any await): active sub-agents tail directly — keeping their
  // registration synchronous for callers that trigger a change immediately. Non-active files
  // are deferred to phase 2's prompt-pairing.
  const pendingPairing: { agentId: AgentId; fileName: FileName }[] = [];
  try {
    const files = fsReaddirAdapter({ dirPath: subagentsDir });
    for (const file of files) {
      if (!String(file).startsWith('agent-')) continue;
      if (!String(file).endsWith('.jsonl')) continue;
      const fileName = fileNameContract.parse(file);
      const agentId = stripAgentFilenamePrefixTransformer({ fileName });
      if (subagentHandles.has(agentId)) continue;
      if (isAgentIdActive({ agentId })) {
        startSubagentTailLayerBroker({ agentId, ...tailArgs });
        continue;
      }
      pendingPairing.push({ agentId, fileName });
    }
  } catch {
    // subagents/ may not exist yet — the poll caller retries on the next tick.
    return adapterResultContract.parse({ success: true });
  }

  // PHASE 2: a non-active file is a NESTED sub-agent (spawned by a sub-agent, so it never gets
  // its own work item) OR a stale leftover from a prior run. Read its first line — Claude CLI
  // writes the spawning Task's prompt there verbatim — and pair it against the processor's
  // outstanding Tasks. A match registers the realAgentId->toolUseId translation (and parent-chain
  // link) and tails it live; a stale file matches no outstanding Task and stays skipped. Reads run
  // concurrently; each pairSubagentByPrompt call runs to completion synchronously, so claiming a
  // Task never races even when two files resolve at once.
  await Promise.all(
    pendingPairing.map(async ({ agentId, fileName }) => {
      try {
        const lines = await fsReadJsonlAdapter({
          filePath: absoluteFilePathContract.parse(`${subagentsDir}/${String(fileName)}`),
        });
        const [firstLine] = lines;
        if (firstLine === undefined) return;
        const parsed = claudeLineNormalizeBroker({ rawLine: firstLine });
        const lineParse = normalizedStreamLineContract.safeParse(parsed);
        if (!lineParse.success) return;
        const lineData = lineParse.data;
        if (lineData.type !== 'user') return;
        const content = lineData.message?.content;
        if (typeof content !== 'string' || content.length === 0) return;
        const paired = processor.pairSubagentByPrompt({
          agentId,
          prompt: taskAgentToolPromptContract.parse(content),
        });
        if (!paired) return;
        startSubagentTailLayerBroker({ agentId, ...tailArgs });
      } catch {
        // Read/normalize failure for one file is non-fatal — the poll retries on the next tick.
      }
    }),
  );

  return adapterResultContract.parse({ success: true });
};
