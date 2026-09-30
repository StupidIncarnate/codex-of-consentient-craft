/**
 * PURPOSE: Defines the `data` QuestListResponder returns on success
 *
 * USAGE:
 * const data = questListResponseDataContract.parse(value);
 * // Returns validated QuestListResponseData
 */

import { z } from '#gateway/npm/zod';
import { questListItemContract, relativeFilePathContract } from '@dungeonmaster/shared/contracts';

export const questListResponseDataContract = z.strictObject({
  quests: z.array(questListItemContract),
  skipped: z.array(
    z.strictObject({
      questFolder: z.string().brand<'SkippedQuestFileQuestFolder'>(),
      questFilePath: z.union([
        z.string().brand<'SkippedQuestFileQuestFilePath'>(),
        relativeFilePathContract,
        z.string().brand<'SkippedQuestFileQuestFilePath'>(),
      ]),
      reason: z.string().brand<'SkippedQuestFileReason'>(),
    }),
  ),
});

export type QuestListResponseData = z.infer<typeof questListResponseDataContract>;
