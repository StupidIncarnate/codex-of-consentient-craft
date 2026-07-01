/**
 * PURPOSE: Orders quests most-recent-first for display by last-modified time
 *
 * USAGE:
 * questsSortByRecencyTransformer({ quests });
 * // Returns a new Quest[] sorted descending by updatedAt ?? createdAt
 */

import type { Quest } from '@dungeonmaster/shared/contracts';

// Recency is the last-modified time (`updatedAt`, stamped on every quest-modify), falling
// back to `createdAt` for quests that have never been modified. Both are ISO-8601 strings,
// so a lexicographic compare is chronological.
export const questsSortByRecencyTransformer = ({ quests }: { quests: readonly Quest[] }): Quest[] =>
  [...quests].sort((a, b) =>
    (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt),
  );
