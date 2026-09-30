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

import { z } from '#gateway/npm/zod';
import { relativeFilePathContract } from '../relative-file-path/relative-file-path-contract';


export const skippedQuestFileContract = z.object({
  questFolder: z.string().min(1).brand<'SkippedQuestFileQuestFolder'>(),
  questFilePath: z.union([z.string().min(1).refine((path) => { if (path.startsWith('/')) { return true; } if (/^[A-Za-z]:\\/u.test(path)) { return true; } return false; }, { message: 'Path must be absolute (start with / or C:\\ on Windows)', },).brand<'SkippedQuestFileQuestFilePath'>(), relativeFilePathContract]).brand<'SkippedQuestFileQuestFilePath'>(),
  reason: z.string().min(1).brand<'SkippedQuestFileReason'>(),
}).brand<'SkippedQuestFile'>();

export type SkippedQuestFile = z.infer<typeof skippedQuestFileContract>;
