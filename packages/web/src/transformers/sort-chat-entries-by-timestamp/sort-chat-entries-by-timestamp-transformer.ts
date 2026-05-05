/**
 * PURPOSE: Stable comparator that orders ChatEntry[] by timestamp so streaming and replay paths render identically.
 *
 * USAGE:
 * sortChatEntriesByTimestampTransformer({ entries });
 * // Returns a new array of entries sorted ascending by timestamp; ties preserve original order.
 *
 * Tie-breaking on equal timestamps relies on Array.prototype.sort being stable (ES2019+) —
 * entries that share a timestamp keep the order they had in the input array. Because the web
 * binding's internal uuid-keyed Map preserves insertion order, ties resolve to arrival order,
 * which matches the order the orchestrator emitted them. A uuid tiebreaker would scramble that
 * arrival order whenever the orchestrator emits multiple entries at the same timestamp (or with
 * the EPOCH fallback when a JSONL line has no timestamp at all), breaking sub-agent chain
 * grouping which depends on positional adjacency.
 */
import type { ChatEntry } from '@dungeonmaster/shared/contracts';

export const sortChatEntriesByTimestampTransformer = ({
  entries,
}: {
  entries: readonly ChatEntry[];
}): ChatEntry[] => {
  const copy = [...entries];
  copy.sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));

  return copy;
};
