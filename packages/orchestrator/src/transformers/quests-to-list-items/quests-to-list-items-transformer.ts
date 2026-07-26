/**
 * PURPOSE: Sorts quests most-recent-first and transforms each into a QuestListItem
 *
 * USAGE:
 * const items = questsToListItemsTransformer({ quests });
 * // Returns QuestListItem[] sorted by updatedAt ?? createdAt descending
 */

import type { Quest, QuestListItem } from '@dungeonmaster/shared/contracts';

import { questToListItemTransformer } from '../quest-to-list-item/quest-to-list-item-transformer';
import { questsSortByRecencyTransformer } from '../quests-sort-by-recency/quests-sort-by-recency-transformer';

export const questsToListItemsTransformer = ({
  quests,
}: {
  quests: readonly Quest[];
}): QuestListItem[] =>
  questsSortByRecencyTransformer({ quests }).map((quest) => questToListItemTransformer({ quest }));
