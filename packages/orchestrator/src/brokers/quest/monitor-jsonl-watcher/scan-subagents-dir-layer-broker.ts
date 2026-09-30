/**
 * PURPOSE: Layer of `quest-monitor-jsonl-watcher-broker` — reads the parent session's `subagents/` directory and starts a tail for every `agent-*.jsonl` file the run has written. Each file is either a NESTED sub-agent (spawned by a sub-agent, so it never gets its own work item) or a stale leftover from a prior run; the broker reads the file's first line — Claude CLI writes the spawning Task's prompt there verbatim — and pairs it against the processor's outstanding Tasks. A match registers the correlation and tails the sub-agent live (so it streams BEFORE finishing); a stale file matches nothing and stays skipped. A missing directory (ENOENT) is tolerated (it may not exist yet during fresh sessions); any other readdir failure propagates. Idempotent: re-invoking on every poll tick is safe — a file this watcher already tailed is skipped, including one whose tail has since been stopped, because a fresh tail reads from byte 0 and would replay the whole transcript.
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
 *   subagentHandles,
 * });
 * // Resolves with void; each matched tail lands in `subagentHandles`
 */

import { isFsError, readdirSync } from '#gateway/node/fs';
import type { TailFileHandle } from '#gateway/node/fs';
import { readNonEmptyLines } from '#gateway/node/fs__promises';
import { absoluteFilePathContract, fileNameContract, type ChatEntry, type FileName, type FilePath, type ProcessId, type SessionId } from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';

import type { ChatLineProcessor } from '../../../contracts/chat-line-processor/chat-line-processor-contract';
import { normalizedStreamLineContract } from '../../../contracts/normalized-stream-line/normalized-stream-line-contract';
import { taskAgentToolPromptContract } from '../../../contracts/task-agent-tool-prompt/task-agent-tool-prompt-contract';
import { streamJsonLinesFromRawTransformer } from '../../../transformers/stream-json-lines-from-raw/stream-json-lines-from-raw-transformer';
import { stripAgentFilenamePrefixTransformer } from '../../../transformers/strip-agent-filename-prefix/strip-agent-filename-prefix-transformer';

import { startSubagentTailLayerBroker } from './start-subagent-tail-layer-broker';
import type { Quest, WorkItem, Agent } from '@dungeonmaster/shared/contracts';

export const scanSubagentsDirLayerBroker = async ({
  subagentsDir,
  sessionFilePath,
  parentSessionId,
  processor,
  chatProcessId,
  activeQuestIdGetter,
  workItemIdForAgent,
  emit,
  subagentHandles,
}: {
  subagentsDir: string;
  sessionFilePath: FilePath;
  parentSessionId: SessionId;
  processor: ChatLineProcessor;
  chatProcessId: ProcessId;
  activeQuestIdGetter: () => Quest['id'] | null;
  // Forwarded to each sub-agent tail so its emits carry the owning `workItemId`. Optional:
  // omitted by layer tests.
  workItemIdForAgent?: (params: { agentId: Agent['id'] }) => WorkItem['id'] | null;
  emit: (params: {
    chatProcessId: ProcessId;
    entries: ChatEntry[];
    questId: Quest['id'] | null;
    sessionId: SessionId;
    workItemId?: WorkItem['id'];
  }) => void;
  subagentHandles: Map<Agent['id'], TailFileHandle>;
}): Promise<void> => {
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

  // Collect every candidate file not already tailed — idempotency against a re-invoked
  // poll tick, not a filter on which files are eligible.
  const pendingPairing: { agentId: Agent['id']; fileName: FileName }[] = [];
  try {
    const files = readdirSync(subagentsDir);
    for (const file of files) {
      if (!file.startsWith('agent-')) continue;
      if (!file.endsWith('.jsonl')) continue;
      const fileName = fileNameContract.parse(file);
      const agentId = stripAgentFilenamePrefixTransformer({ fileName });
      if (subagentHandles.has(agentId)) continue;
      pendingPairing.push({ agentId, fileName });
    }
  } catch (error: unknown) {
    // subagents/ may not exist yet — the poll caller retries on the next tick. Any other readdir
    // failure (EACCES on the person's own transcript directory) propagates to the caller's catch.
    if (isFsError({ error, code: 'ENOENT' })) {
      return;
    }
    throw error;
  }

  // Every candidate file is either a NESTED sub-agent (spawned by a sub-agent, so it never
  // gets its own work item) OR a stale leftover from a prior run. Read its first line —
  // Claude CLI writes the spawning Task's prompt there verbatim — and pair it against the
  // processor's outstanding Tasks. A match registers the realAgentId->toolUseId translation
  // (and parent-chain link) and tails it live; a stale file matches no outstanding Task and
  // stays skipped. Reads run concurrently; each pairSubagentByPrompt call runs to completion
  // synchronously, so claiming a Task never races even when two files resolve at once.
  await Promise.all(
    pendingPairing.map(async ({ agentId, fileName }) => {
      try {
        const lines = streamJsonLinesFromRawTransformer({
          rawLines: await readNonEmptyLines(
            absoluteFilePathContract.parse(`${subagentsDir}/${String(fileName)}`),
          ),
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
};
