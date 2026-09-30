/**
 * PURPOSE: Defines the data `folderConstraintsInitBroker` returns
 *
 * USAGE:
 * folderConstraintsInitResultContract.parse(value);
 * // Returns validated FolderConstraintsInitResult
 */
import { z } from '#gateway/npm/zod';
import { folderTypeContract } from '@dungeonmaster/shared/contracts';

export const folderConstraintsInitResultContract = z
  .object({
    folderConstraints: z.map(
      folderTypeContract,
      z.string().brand<'FolderConstraintsInitResultFolderConstraints'>(),
    ),
  })
  .brand<'FolderConstraintsInitResult'>();

export type FolderConstraintsInitResult = z.infer<typeof folderConstraintsInitResultContract>;
