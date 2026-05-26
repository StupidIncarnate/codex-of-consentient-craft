/**
 * PURPOSE: Layer of `quest-monitor-jsonl-watcher-broker` — reads the parent session's `subagents/` directory, then calls `startSubagentTailLayerBroker` for every `agent-*.jsonl` file present. ENOENT and other readdir failures are silently swallowed (the directory may not exist yet during fresh sessions). The layer broker's idempotency contract means re-invoking this on every poll tick is safe.
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
 *   onSessionIdLearned,
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
  type QuestWorkItemId,
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
  onSessionIdLearned,
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
  onSessionIdLearned?: (params: {
    questId: QuestId;
    workItemId: QuestWorkItemId;
    sessionId: SessionId;
  }) => void;
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
      startSubagentTailLayerBroker({
        agentId,
        sessionFilePath,
        parentSessionId,
        processor,
        chatProcessId,
        activeQuestIdGetter,
        emit,
        ...(onSessionIdLearned === undefined ? {} : { onSessionIdLearned }),
        subagentHandles,
      });
    }
  } catch {
    // subagents/ may not exist yet — the poll caller retries on the next tick.
  }
  return adapterResultContract.parse({ success: true });
};
