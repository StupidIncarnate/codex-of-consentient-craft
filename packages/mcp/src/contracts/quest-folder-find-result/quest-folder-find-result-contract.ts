/**
 * PURPOSE: Defines the result of finding a quest folder by ID
 *
 * USAGE:
 * questFolderFindResultContract.parse({ found: true, folderPath: '/path', quest: {...} });
 * // Returns: QuestFolderFindResult object
 */
import { z } from 'zod';

import { questContract } from '@dungeonmaster/shared/contracts';

import { filePathContract } from '../file-path/file-path-contract';

export const questFolderFindResultContract = z.union([
  z.object({
    found: z.literal(true),
    folderPath: filePathContract,
    quest: questContract,
  }),
  z.object({
    found: z.literal(false),
    folderPath: z.undefined(),
    quest: z.undefined(),
  }),
]);

export type QuestFolderFindResult = z.infer<typeof questFolderFindResultContract>;
