/**
 * PURPOSE: Derives a Map<K, ChatEntry[]> (sorted) from a uuid-keyed Map<K, Map<ChatEntryUuid, ChatEntry>>.
 *
 * USAGE:
 * deriveSortedChatEntriesMapTransformer({ source: entriesByKeyInternal });
 * // Returns Map<K, ChatEntry[]> where each value is the inner map's values sorted by (timestamp, uuid).
 *
 * The web binding stores entries internally as a uuid-keyed Map per session/slot for dedup,
 * then exposes a Map<K, ChatEntry[]> to consumers. This transformer is the projection step:
 * for each session, take the inner map's values and sort them so streaming and replay paths
 * render identical DOM regardless of arrival order.
 */
import type { ChatEntry, ChatEntryUuid } from '@dungeonmaster/shared/contracts';

import { sortChatEntriesByTimestampTransformer } from '../sort-chat-entries-by-timestamp/sort-chat-entries-by-timestamp-transformer';

export const deriveSortedChatEntriesMapTransformer = <K>({
  source,
}: {
  source: Map<K, Map<ChatEntryUuid, ChatEntry>>;
}): Map<K, ChatEntry[]> => {
  const result = new Map<K, ChatEntry[]>();
  for (const [key, inner] of source.entries()) {
    result.set(key, sortChatEntriesByTimestampTransformer({ entries: [...inner.values()] }));
  }

  return result;
};
