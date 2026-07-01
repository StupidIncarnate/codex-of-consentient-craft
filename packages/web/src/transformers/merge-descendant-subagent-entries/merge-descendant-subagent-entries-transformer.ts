/**
 * PURPOSE: Merges a parent row's own transcript with the descendant sub-agent entries it spawned —
 * pulling, from a session-wide pool, every entry whose chain descends from a Task/Agent tool_use in
 * the parent's own entries. Nested sub-agent transcripts arrive bucketed under their own (or an
 * ancestor's) workItemId, so a parent row scoped to its own work-item bucket sees the nested Task
 * tool_use line but not the nested sub-agent's own entries; this feeds them back in so
 * collectSubagentChainsTransformer populates the nested SubagentChainGroup instead of rendering it
 * with `(0 entries)`.
 *
 * USAGE:
 * mergeDescendantSubagentEntriesTransformer({ ownEntries, poolEntries });
 * // Returns ownEntries followed by descendant sub-agent entries found only in poolEntries.
 * // When ownEntries already contains every descendant (or spawns nothing), returns ownEntries as-is.
 */

import type { ChatEntry, ChatEntryUuid } from '@dungeonmaster/shared/contracts';
import type { SubagentChainGroup } from '../../contracts/chat-entry-group/chat-entry-group-contract';
import { isTaskToolUseGuard } from '../../guards/is-task-tool-use/is-task-tool-use-guard';

type ChainAgentId = SubagentChainGroup['agentId'];

export const mergeDescendantSubagentEntriesTransformer = ({
  ownEntries,
  poolEntries,
}: {
  ownEntries: ChatEntry[];
  poolEntries: ChatEntry[];
}): ChatEntry[] => {
  // Seed the chain queue with the chains the parent's own transcript spawned (each Task/Agent
  // tool_use line's agentId is the spawned child's wire key).
  const chainQueue: ChainAgentId[] = [];
  for (const entry of ownEntries) {
    if (!isTaskToolUseGuard({ entry })) continue;
    const agentIdValue =
      'agentId' in entry && entry.agentId !== undefined ? String(entry.agentId) : '';
    if (agentIdValue.length > 0) chainQueue.push(agentIdValue as ChainAgentId);
  }

  if (chainQueue.length === 0) return ownEntries;

  // Build lookup Map in a single O(poolEntries) pass.
  // An entry belongs to a chain's bucket if its agentId or parentAgentId matches the chainId.
  // Scanning poolEntries in order means entries within each bucket are in pool-traversal order.
  const byChainId = new Map<ChainAgentId, ChatEntry[]>();
  for (const entry of poolEntries) {
    const agentId =
      'agentId' in entry && entry.agentId !== undefined
        ? (String(entry.agentId) as ChainAgentId)
        : undefined;
    const parentAgentId =
      'parentAgentId' in entry && entry.parentAgentId !== undefined
        ? (String(entry.parentAgentId) as ChainAgentId)
        : undefined;

    if (agentId !== undefined) {
      const bucket = byChainId.get(agentId);
      if (bucket === undefined) {
        byChainId.set(agentId, [entry]);
      } else {
        bucket.push(entry);
      }
    }

    if (parentAgentId !== undefined) {
      const bucket = byChainId.get(parentAgentId);
      if (bucket === undefined) {
        byChainId.set(parentAgentId, [entry]);
      } else {
        bucket.push(entry);
      }
    }
  }

  const ownUuids = new Set<ChatEntryUuid>(ownEntries.map((entry) => entry.uuid));
  const collected = new Map<ChatEntryUuid, ChatEntry>();
  const processedChains = new Set<ChainAgentId>();

  // BFS over the chain graph: each dequeued chainId pulls only its pre-built bucket
  // (O(bucket) per step instead of O(poolEntries)), and each collected nested Task/Agent
  // tool_use enqueues its own chainId so deeper chains are reached too — no depth cap.
  // processedChains makes it terminate on cyclic or duplicate links.
  while (chainQueue.length > 0) {
    const chainId = chainQueue.shift();
    if (chainId === undefined || processedChains.has(chainId)) continue;
    processedChains.add(chainId);

    const bucket = byChainId.get(chainId) ?? [];
    for (const entry of bucket) {
      const { uuid } = entry;
      if (ownUuids.has(uuid) || collected.has(uuid)) continue;

      collected.set(uuid, entry);

      if (isTaskToolUseGuard({ entry })) {
        const agentIdValue =
          'agentId' in entry && entry.agentId !== undefined
            ? (String(entry.agentId) as ChainAgentId)
            : undefined;
        if (agentIdValue !== undefined && agentIdValue.length > 0) {
          chainQueue.push(agentIdValue);
        }
      }
    }
  }

  if (collected.size === 0) return ownEntries;

  return [...ownEntries, ...collected.values()];
};
