/**
 * PURPOSE: Defines the structure of a project folder reference
 *
 * USAGE:
 * projectFolderContract.parse({name: 'ward', path: '/home/user/project/packages/ward'});
 * // Returns: ProjectFolder validated object
 */

import { z } from '#gateway/npm/zod';

export const projectFolderContract = z
  .object({
    name: z.string().brand<'ProjectFolderName'>(),
    path: z.string().brand<'ProjectFolderPath'>(),
  })
  .brand<'ProjectFolder'>();

export type ProjectFolder = z.infer<typeof projectFolderContract>;
