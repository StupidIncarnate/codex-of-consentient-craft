/**
 * PURPOSE: Defines the quest-list payload that carries BOTH the loadable quests and the quest files that were skipped
 *
 * USAGE:
 * questListResultContract.parse({ quests: [questListItem], skipped: [skippedQuestFile] });
 * // Returns: QuestListResult — a short `quests` array is self-describing because `skipped` says what is missing
 */

import { z } from 'zod';

import { questListItemContract } from '../quest-list-item/quest-list-item-contract';
import { skippedQuestFileContract } from '../skipped-quest-file/skipped-quest-file-contract';

export const questListResultContract = z.object({
  quests: questListItemContract.array(),
  skipped: skippedQuestFileContract.array().default([]),
});

export type QuestListResult = z.infer<typeof questListResultContract>;
