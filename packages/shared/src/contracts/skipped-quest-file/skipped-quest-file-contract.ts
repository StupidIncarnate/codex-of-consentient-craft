/**
 * PURPOSE: Describes one quest folder whose quest.json could not be loaded, so a caller can report the omission
 *
 * USAGE:
 * skippedQuestFileContract.parse({
 *   questFolder: '4226b8d1-2827-4250-8d82-c278d66bcd2d',
 *   questFilePath: '/home/user/.dungeonmaster/guilds/g1/quests/4226b8d1/quest.json',
 *   reason: "workItems.1.role: Invalid enum value, received 'pathseeker'",
 * });
 * // Returns: SkippedQuestFile object
 */

import { z } from 'zod';

import { filePathContract } from '../file-path/file-path-contract';

export const skippedQuestFileContract = z.object({
  questFolder: z.string().min(1).brand<'QuestFolder'>(),
  questFilePath: filePathContract,
  reason: z.string().min(1).brand<'SkipReason'>(),
});

export type SkippedQuestFile = z.infer<typeof skippedQuestFileContract>;
