/**
 * PURPOSE: Defines the `data` QuestListResponder returns on success
 *
 * USAGE:
 * const data = questListResponseDataContract.parse(value);
 * // Returns validated QuestListResponseData
 */

import { z } from '#gateway/npm/zod';
import { questListItemContract, relativeFilePathContract, questContract } from '@dungeonmaster/shared/contracts';

export const questListResponseDataContract = z.strictObject({
  quests: z.array(questListItemContract),
  skipped: z.array(
    z.strictObject({
      questFolder: questContract.shape.folder,
      questFilePath: z.union([
        z.string().brand<'QuestListResponseDataSkippedQuestFilePath'>(),
        relativeFilePathContract,
        z.string().brand<'QuestListResponseDataSkippedQuestFilePath'>(),
      ]),
      reason: z.string().brand<'QuestListResponseDataSkippedReason'>(),
    }).brand<'QuestListResponseDataSkipped'>(),
  ),
}).brand<'QuestListResponseData'>();

export type QuestListResponseData = z.infer<typeof questListResponseDataContract>;
