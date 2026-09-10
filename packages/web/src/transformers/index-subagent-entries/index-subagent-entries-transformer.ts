/**
 * PURPOSE: Builds a Map from agentId to ChatEntry[] for all sub-agent entries. Excludes
 * `task_notification` entries even when they carry `source: 'subagent'` — a nested chain's OWN
 * completion notification is read from the dispatching sub-agent's transcript file, so it is
 * always stamped that way, and bucketing it here would mark it `consumed` before
 * collectSubagentChainsTransformer's dedicated notification search runs, making it permanently
 * unreachable as `group.taskNotification`.
 *
 * USAGE:
 * indexSubagentEntriesTransformer({entries: chatEntries});
 * // Returns Map<string, ChatEntry[]> keyed by agentId
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import type { SubagentChainGroup } from '../../contracts/chat-entry-group/chat-entry-group-contract';

type ChainAgentId = SubagentChainGroup['agentId'];

export const indexSubagentEntriesTransformer = ({
  entries,
}: {
  entries: ChatEntry[];
}): Map<ChainAgentId, ChatEntry[]> => {
  const subagentMap = new Map<ChainAgentId, ChatEntry[]>();

  for (const entry of entries) {
    if (
      'agentId' in entry &&
      entry.agentId !== undefined &&
      'source' in entry &&
      entry.source === 'subagent' &&
      !('type' in entry && entry.type === 'task_notification')
    ) {
      const key = String(entry.agentId) as ChainAgentId;
      const existing = subagentMap.get(key);

      if (existing === undefined) {
        subagentMap.set(key, [entry]);
      } else {
        existing.push(entry);
      }
    }
  }

  return subagentMap;
};
