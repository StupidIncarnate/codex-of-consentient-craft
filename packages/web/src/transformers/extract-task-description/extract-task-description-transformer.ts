/**
 * PURPOSE: Extract human-readable description from Task tool_use toolInput JSON
 *
 * USAGE:
 * extractTaskDescriptionTransformer({entry: taskToolUseEntry});
 * // Returns 'Run tests'
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import { taskToolInputContract } from '../../contracts/task-tool-input/task-tool-input-contract';
const FALLBACK_DESCRIPTION = 'Sub-agent task';

export const extractTaskDescriptionTransformer = ({
  entry,
}: {
  entry: ChatEntry;
}): string => {
  if (entry.role !== 'assistant' || !('toolInput' in entry)) {
    return FALLBACK_DESCRIPTION;
  }

  try {
    const result = taskToolInputContract.safeParse(JSON.parse(String(entry.toolInput)));

    if (!result.success || result.data.description.length === 0) {
      return FALLBACK_DESCRIPTION;
    }

    return result.data.description;
  } catch {
    return FALLBACK_DESCRIPTION;
  }
};
