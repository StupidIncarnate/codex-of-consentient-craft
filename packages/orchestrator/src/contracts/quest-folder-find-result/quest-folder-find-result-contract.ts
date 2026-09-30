/**
 * PURPOSE: Defines the result of finding a quest folder by ID
 *
 * USAGE:
 * questFolderFindResultContract.parse({ found: true, folderPath: '/path', quest: {...} });
 * // Returns: QuestFolderFindResult object
 */
import { z } from '#gateway/npm/zod';

import { questContract, relativeFilePathContract } from '@dungeonmaster/shared/contracts';

export const questFolderFindResultContract = z.union([
  z
    .object({
      found: z.literal(true),
      folderPath: z
        .union([
          z
            .string()
            .min(1)
            .refine(
              (path) => {
                if (path.startsWith('/')) {
                  return true;
                }
                if (/^[A-Za-z]:\\/u.test(path)) {
                  return true;
                }
                return false;
              },
              { message: 'Path must be absolute (start with / or C:\\ on Windows)' },
            )
            .brand<'QuestFolderFindResultFolderPath'>(),
          relativeFilePathContract,
        ])
        .brand<'QuestFolderFindResultFolderPath'>(),
      quest: questContract,
    })
    .brand<'QuestFolderFindResult'>(),
  z
    .object({
      found: z.literal(false),
      folderPath: z.undefined(),
      quest: z.undefined(),
    })
    .brand<'QuestFolderFindResult'>(),
]);

export type QuestFolderFindResult = z.infer<typeof questFolderFindResultContract>;
