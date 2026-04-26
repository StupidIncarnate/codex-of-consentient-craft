/**
 * PURPOSE: Extract human-readable description from Task tool_use toolInput JSON
 *
 * USAGE:
 * extractTaskDescriptionTransformer({entry: taskToolUseEntry});
 * // Returns 'Run tests'
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import { taskToolInputContract } from '../../contracts/task-tool-input/task-tool-input-contract';
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
    const result = taskToolInputContract.safeParse(parsed);

    if (!result.success || result.data.description.length === 0) {
      return FALLBACK_DESCRIPTION;
    }

    return result.data.description;
  } catch {
    return FALLBACK_DESCRIPTION;
  }
};
