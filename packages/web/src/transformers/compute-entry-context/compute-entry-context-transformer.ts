/**
 * PURPOSE: Extracts the total context token count from a chat entry's usage data
 *
 * USAGE:
 * computeEntryContextTransformer({entry: chatEntry});
 * // Returns ContextTokenCount or null if entry has no usage
 */

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
import type { ContextTokenCount } from '../../contracts/context-token-count/context-token-count-contract';

export const computeEntryContextTransformer = ({
  entry,
}: {
  entry: ChatEntry;
}): ContextTokenCount | null => {
  if (!('usage' in entry) || entry.usage === undefined) {
    return null;
  }

  const { usage } = entry;

  return contextTokenCountContract.parse(
    Number(usage.inputTokens) +
      Number(usage.cacheCreationInputTokens) +
      Number(usage.cacheReadInputTokens),
  );
};
