/**
 * PURPOSE: Pairs tool_use entries with their corresponding tool_result entries by matching IDs
 *
 * USAGE:
 * pairToolEntriesTransformer({entries: toolGroupEntries});
 * // Returns ToolCallPair[] with each tool_use linked to its tool_result (or null if pending)
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import type { ToolCallPair } from '../../contracts/tool-call-pair/tool-call-pair-contract';
import { toolCallPairContract } from '../../contracts/tool-call-pair/tool-call-pair-contract';
import { toolNameContract } from '../../contracts/tool-name/tool-name-contract';
import type { ToolName } from '../../contracts/tool-name/tool-name-contract';

type ToolResultEntry = Extract<ChatEntry, { type: 'tool_result' }>;

export const pairToolEntriesTransformer = ({
  entries,
}: {
  entries: ChatEntry[];
}): ToolCallPair[] => {
  const pairs: ToolCallPair[] = [];
  const resultByToolUseId = new Map<ToolName, ToolResultEntry>();
  const matchedToolNames = new Set<ToolName>();

  // Index all tool_result entries by their tool_use_id (stored in toolName field)
  for (const entry of entries) {
    if ('type' in entry && entry.type === 'tool_result') {
      resultByToolUseId.set(entry.toolName, entry);
    }
  }

  // Create pairs from tool_use entries in order of appearance
  for (const entry of entries) {
    if ('type' in entry && entry.type === 'tool_use') {
      const { toolUseId } = entry;
      // tool_result stores tool_use_id in its toolName field - rebrand to match
      const lookupKey = toolUseId === undefined ? null : toolNameContract.parse(toolUseId);
      const matchedResult = lookupKey === null ? null : (resultByToolUseId.get(lookupKey) ?? null);

      if (lookupKey !== null && matchedResult !== null) {
        matchedToolNames.add(lookupKey);
      }

      pairs.push(
        toolCallPairContract.parse({
          toolUse: entry,
          toolResult: matchedResult,
        }),
      );
    }
  }

  // Add orphan tool_result entries (no matching tool_use found)
  for (const entry of entries) {
    if ('type' in entry && entry.type === 'tool_result') {
      if (!matchedToolNames.has(entry.toolName)) {
        pairs.push(
          toolCallPairContract.parse({
            toolUse: null,
            toolResult: entry,
          }),
        );
      }
    }
  }

  return pairs;
};
