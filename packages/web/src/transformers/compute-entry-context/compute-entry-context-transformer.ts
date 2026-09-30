/**
 * PURPOSE: Extracts the total context token count from a chat entry's usage data
 *
 * USAGE:
 * computeEntryContextTransformer({entry: chatEntry});
 * // Returns ContextTokenCount or null if entry has no usage
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';

export const computeEntryContextTransformer = ({
  entry,
}: {
  entry: ChatEntry;
}): number | null => {
  if (!('usage' in entry) || entry.usage === undefined) {
    return null;
  }

  const { usage } = entry;

  return (Number(usage.inputTokens) +
      Number(usage.cacheCreationInputTokens) +
      Number(usage.cacheReadInputTokens));
};
