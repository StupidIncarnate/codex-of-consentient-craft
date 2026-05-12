/**
 * PURPOSE: Computes the tail-window start index for a merged-chat-item list — the index of the most recent message item, falling back to the last item when no message anchor exists
 *
 * USAGE:
 * computeMergedItemTailIndexTransformer({ items: mergedItems });
 * // Returns: TailStartIndex pointing at the most recent text/user/system entry; items.slice(index) is the visible tail.
 */

import type { MergedChatItem } from '../../contracts/merged-chat-item/merged-chat-item-contract';
import { tailStartIndexContract } from '../../contracts/tail-start-index/tail-start-index-contract';
import type { TailStartIndex } from '../../contracts/tail-start-index/tail-start-index-contract';
import { isMessageAnchorEntryGuard } from '../../guards/is-message-anchor-entry/is-message-anchor-entry-guard';

export const computeMergedItemTailIndexTransformer = ({
  items,
}: {
  items: MergedChatItem[];
}): TailStartIndex => {
  if (items.length === 0) {
    return tailStartIndexContract.parse(0);
  }

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (item === undefined) continue;
    if (item.kind !== 'entry') continue;
    if (isMessageAnchorEntryGuard({ entry: item.entry })) {
      return tailStartIndexContract.parse(i);
    }
  }

  return tailStartIndexContract.parse(items.length - 1);
};
