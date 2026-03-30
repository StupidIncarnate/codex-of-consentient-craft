/**
 * PURPOSE: Computes the total context token label from the last entry with usage data in a list of chat entries
 *
 * USAGE:
 * computeRowContextTotalTransformer({entries: chatEntries});
 * // Returns FormattedTokenLabel like "29.4k" or null if no entries have usage
 */

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import type { FormattedTokenLabel } from '../../contracts/formatted-token-label/formatted-token-label-contract';
import { computeEntryContextTransformer } from '../compute-entry-context/compute-entry-context-transformer';
import { formatContextTokensTransformer } from '../format-context-tokens/format-context-tokens-transformer';

export const computeRowContextTotalTransformer = ({
  entries,
}: {
  entries: ChatEntry[];
}): FormattedTokenLabel | null => {
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    if (entry === undefined) continue;

    const totalContext = computeEntryContextTransformer({ entry });

    if (totalContext !== null) {
      return formatContextTokensTransformer({ count: totalContext });
    }
  }

  return null;
};
