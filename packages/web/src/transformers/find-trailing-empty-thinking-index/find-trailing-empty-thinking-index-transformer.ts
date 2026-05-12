/**
 * PURPOSE: Returns the index of a trailing empty-content assistant thinking entry in a group list, or -1 when none. Used by ChatEntryListWidget to swap that placeholder for a streaming indicator.
 *
 * USAGE:
 * findTrailingEmptyThinkingIndexTransformer({ groups: chatEntryGroups });
 * // Returns groups.length - 1 when the last group is a single assistant 'thinking' entry with empty content; otherwise -1.
 */

import type { ChatEntryGroup } from '../../contracts/chat-entry-group/chat-entry-group-contract';
import { trailingThinkingIndexContract } from '../../contracts/trailing-thinking-index/trailing-thinking-index-contract';
import type { TrailingThinkingIndex } from '../../contracts/trailing-thinking-index/trailing-thinking-index-contract';

export const findTrailingEmptyThinkingIndexTransformer = ({
  groups,
}: {
  groups: ChatEntryGroup[];
}): TrailingThinkingIndex => {
  const lastGroup = groups.at(-1);
  if (lastGroup === undefined) {
    return trailingThinkingIndexContract.parse(-1);
  }
  if (lastGroup.kind !== 'single') {
    return trailingThinkingIndexContract.parse(-1);
  }

  const { entry } = lastGroup;
  if (entry.role !== 'assistant') {
    return trailingThinkingIndexContract.parse(-1);
  }
  if (!('type' in entry) || entry.type !== 'thinking') {
    return trailingThinkingIndexContract.parse(-1);
  }
  if (entry.content.length !== 0) {
    return trailingThinkingIndexContract.parse(-1);
  }

  return trailingThinkingIndexContract.parse(groups.length - 1);
};
