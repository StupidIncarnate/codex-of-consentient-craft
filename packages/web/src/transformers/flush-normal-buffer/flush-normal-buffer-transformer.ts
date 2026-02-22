/**
 * PURPOSE: Flushes a buffer of normal (non-chain) chat entries through groupChatEntriesTransformer
 *
 * USAGE:
 * flushNormalBufferTransformer({buffer: [userEntry, textEntry]});
 * // Returns ChatEntryGroup[] from grouping the buffered entries
 */

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import type { ChatEntryGroup } from '../../contracts/chat-entry-group/chat-entry-group-contract';
import { groupChatEntriesTransformer } from '../group-chat-entries/group-chat-entries-transformer';

export const flushNormalBufferTransformer = ({
  buffer,
}: {
  buffer: ChatEntry[];
}): ChatEntryGroup[] => {
  if (buffer.length === 0) {
    return [];
  }

  return groupChatEntriesTransformer({ entries: buffer });
};
