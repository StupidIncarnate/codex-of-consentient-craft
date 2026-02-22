/**
 * PURPOSE: Extract human-readable description from Task tool_use toolInput JSON
 *
 * USAGE:
 * extractTaskDescriptionTransformer({entry: taskToolUseEntry});
 * // Returns 'Run tests'
 */

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import type { SubagentChainGroup } from '../../contracts/chat-entry-group/chat-entry-group-contract';

type ChainDescription = SubagentChainGroup['description'];

const FALLBACK_DESCRIPTION = 'Sub-agent task' as ChainDescription;

export const extractTaskDescriptionTransformer = ({
  entry,
}: {
  entry: ChatEntry;
}): ChainDescription => {
  if (entry.role !== 'assistant' || !('toolInput' in entry)) {
    return FALLBACK_DESCRIPTION;
  }

  try {
    const parsed: unknown = JSON.parse(String(entry.toolInput));

    if (typeof parsed !== 'object' || parsed === null || !('description' in parsed)) {
      return FALLBACK_DESCRIPTION;
    }

    const description: unknown = Reflect.get(parsed, 'description');

    if (typeof description !== 'string' || description.length === 0) {
      return FALLBACK_DESCRIPTION;
    }

    return description as ChainDescription;
  } catch {
    return FALLBACK_DESCRIPTION;
  }
};
