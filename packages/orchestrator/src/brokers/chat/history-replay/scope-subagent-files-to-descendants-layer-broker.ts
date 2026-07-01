/**
 * PURPOSE: Layer of `chatHistoryReplayBroker` — scopes a flat list of on-disk sub-agent JSONL
 * files to the root sub-agent PLUS every nested sub-agent it transitively spawned. A nested
 * sub-agent B (spawned by A) writes its own `subagents/agent-<B>.jsonl`; A's JSONL holds B's
 * completion `tool_result` (whose `toolUseResult.agentId` is B's realAgentId — the spawn edge
 * A -> B). Building the edge graph from every file's tool_results and walking the descendant
 * closure keeps B's file while leaving unrelated sibling sub-agents out of this work item's scope.
 *
 * USAGE:
 * scopeSubagentFilesToDescendantsLayerBroker({ files, rootAgentId });
 * // Returns the subset of `files` whose agentId is rootAgentId or a transitive descendant.
 */

import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';

import { agentIdContract } from '../../../contracts/agent-id/agent-id-contract';
import type { AgentId } from '../../../contracts/agent-id/agent-id-contract';
import { normalizedStreamLineContract } from '../../../contracts/normalized-stream-line/normalized-stream-line-contract';
import type { SubagentFile } from '../../../contracts/subagent-file/subagent-file-contract';
import { subagentDescendantAgentIdsTransformer } from '../../../transformers/subagent-descendant-agent-ids/subagent-descendant-agent-ids-transformer';

export const scopeSubagentFilesToDescendantsLayerBroker = ({
  files,
  rootAgentId,
}: {
  files: SubagentFile[];
  rootAgentId: AgentId;
}): SubagentFile[] => {
  const childEdges = new Map<AgentId, AgentId[]>();
  for (const file of files) {
    for (const line of file.lines) {
      const parsed = claudeLineNormalizeBroker({ rawLine: line });
      const lineParse = normalizedStreamLineContract.safeParse(parsed);
      if (!lineParse.success) continue;
      const lineData = lineParse.data;
      if (lineData.type !== 'user') continue;
      const { toolUseResult } = lineData;
      if (
        toolUseResult === undefined ||
        typeof toolUseResult === 'string' ||
        Array.isArray(toolUseResult)
      ) {
        continue;
      }
      const childRealRaw = toolUseResult.agentId;
      if (typeof childRealRaw !== 'string' || childRealRaw.length === 0) continue;
      const childReal = agentIdContract.parse(childRealRaw);
      const existing = childEdges.get(file.agentId);
      if (existing === undefined) {
        childEdges.set(file.agentId, [childReal]);
      } else {
        existing.push(childReal);
      }
    }
  }

  const closure = subagentDescendantAgentIdsTransformer({ childEdges, rootAgentId });
  return files.filter((file) => closure.has(file.agentId));
};
