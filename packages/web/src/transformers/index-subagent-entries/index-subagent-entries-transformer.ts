/**
 * PURPOSE: Builds a Map from agentId to ChatEntry[] for all sub-agent entries
 *
 * USAGE:
 * indexSubagentEntriesTransformer({entries: chatEntries});
 * // Returns Map<string, ChatEntry[]> keyed by agentId
 */

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
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
      entry.source === 'subagent'
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
