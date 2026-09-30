/**
 * PURPOSE: Computes the tail-window start index for a chat-entry-group list — the index of the most recent message anchor (text/user/system entry OR sub-agent chain), falling back to the last group when no anchor exists
 *
 * USAGE:
 * computeGroupTailIndexTransformer({ groups: chatEntryGroups });
 * // Returns: TailStartIndex pointing at the most recent message-anchor group; groups.slice(index) is the visible tail.
 */

import type { ChatEntryGroup } from '../../contracts/chat-entry-group/chat-entry-group-contract';
import { isMessageAnchorEntryGuard } from '../../guards/is-message-anchor-entry/is-message-anchor-entry-guard';

export const computeGroupTailIndexTransformer = ({
  groups,
}: {
  groups: ChatEntryGroup[];
}): number => {
  if (groups.length === 0) {
    return 0;
  }

  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    if (group === undefined) continue;
    if (group.kind === 'subagent-chain') {
      return i;
    }
    if (isMessageAnchorEntryGuard({ entry: group.entry })) {
      return i;
    }
  }

  return groups.length - 1;
};
