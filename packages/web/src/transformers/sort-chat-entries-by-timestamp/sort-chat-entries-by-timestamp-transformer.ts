/**
 * PURPOSE: Stable comparator that orders ChatEntry[] by (timestamp, uuid) so streaming and replay paths render identically.
 *
 * USAGE:
 * sortChatEntriesByTimestampTransformer({ entries });
 * // Returns a new array of entries sorted ascending by timestamp; ties broken by uuid.
 *
 * The web binding maintains a uuid-keyed Map per session for dedup, then derives the rendered
 * array via this comparator. Both the parent stdout and the sub-agent JSONL tail emit the same
 * uuid+timestamp for the same content, so dedup collapses duplicates and the timestamp sort
 * matches the order replay would produce — eliminating the streaming-vs-replay drift that
 * surfaces as out-of-order sub-agent chains during live runs.
 */
import type { ChatEntry } from '@dungeonmaster/shared/contracts';

export const sortChatEntriesByTimestampTransformer = ({
  entries,
}: {
  entries: readonly ChatEntry[];
}): ChatEntry[] => {
  const copy = [...entries];
  copy.sort((a, b) => {
    const tsCompare = String(a.timestamp).localeCompare(String(b.timestamp));
    if (tsCompare !== 0) return tsCompare;

    return String(a.uuid).localeCompare(String(b.uuid));
  });

  return copy;
};
