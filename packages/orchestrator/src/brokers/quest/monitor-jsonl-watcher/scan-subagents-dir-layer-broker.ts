/**
 * PURPOSE: Layer of `quest-monitor-jsonl-watcher-broker` — reads the parent session's `subagents/` directory, then calls `startSubagentTailLayerBroker` for every `agent-*.jsonl` file whose agentId is currently active per the supplied `isAgentIdActive` predicate. Stale subagent JSONLs left on disk from prior /dumpster-launch runs are skipped — they no longer match an in-progress work item's stamped agentId, so live-tailing them would burn fs handles and re-emit dead chat. ENOENT and other readdir failures are silently swallowed (the directory may not exist yet during fresh sessions). Idempotent: re-invoking on every poll tick is safe.
 *
 * USAGE:
 * scanSubagentsDirLayerBroker({
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
  adapterResultContract,
  fileNameContract,
  type AdapterResult,
  type ChatEntry,
  type FilePath,
  type ProcessId,
  type QuestId,
  type SessionId,
} from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import type { fsWatchTailAdapter } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter';
import type { AgentId } from '../../../contracts/agent-id/agent-id-contract';
import type { ChatLineProcessor } from '../../../contracts/chat-line-processor/chat-line-processor-contract';
import { stripAgentFilenamePrefixTransformer } from '../../../transformers/strip-agent-filename-prefix/strip-agent-filename-prefix-transformer';

import { startSubagentTailLayerBroker } from './start-subagent-tail-layer-broker';

export const scanSubagentsDirLayerBroker = ({
  subagentsDir,
  sessionFilePath,
  parentSessionId,
  processor,
  chatProcessId,
  activeQuestIdGetter,
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
  emit: (params: {
    chatProcessId: ProcessId;
    entries: ChatEntry[];
    questId: QuestId | null;
    sessionId: SessionId;
  }) => void;
  // Returns true iff a file's agentId matches an in-progress work item stamped via
  // get-agent-prompt. Files without a current match are skipped. Stale leftover JSONLs
  // from prior /dumpster-launch runs are never tailed.
  isAgentIdActive: (params: { agentId: AgentId }) => boolean;
  subagentHandles: Map<AgentId, ReturnType<typeof fsWatchTailAdapter>>;
}): AdapterResult => {
  try {
    const files = fsReaddirAdapter({ dirPath: subagentsDir });
    for (const file of files) {
      if (!String(file).startsWith('agent-')) continue;
      if (!String(file).endsWith('.jsonl')) continue;
      const agentId = stripAgentFilenamePrefixTransformer({
        fileName: fileNameContract.parse(file),
      });
      if (!isAgentIdActive({ agentId })) continue;
      startSubagentTailLayerBroker({
        agentId,
        sessionFilePath,
        parentSessionId,
        processor,
        chatProcessId,
        activeQuestIdGetter,
        emit,
        subagentHandles,
      });
    }
  } catch {
    // subagents/ may not exist yet — the poll caller retries on the next tick.
  }
  return adapterResultContract.parse({ success: true });
};
