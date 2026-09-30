/**
 * PURPOSE: Defines the result of finding a quest folder by ID
 *
 * USAGE:
 * questFolderFindResultContract.parse({ found: true, folderPath: '/path', quest: {...} });
 * // Returns: QuestFolderFindResult object
 */
import { z } from '#gateway/npm/zod';

import { questContract, absoluteFilePathContract, relativeFilePathContract } from '@dungeonmaster/shared/contracts';

export const questFolderFindResultContract = z.union([
  z.object({
    found: z.literal(true),
    folderPath: z.union([absoluteFilePathContract, relativeFilePathContract]).brand<'QuestFolderFindResultFolderPath'>(),
    quest: questContract,
  }).brand<'QuestFolderFindResult'>(),
  z.object({
    found: z.literal(false),
    folderPath: z.undefined(),
    quest: z.undefined(),
  }).brand<'QuestFolderFindResult'>(),
]);

export type QuestFolderFindResult = z.infer<typeof questFolderFindResultContract>;
