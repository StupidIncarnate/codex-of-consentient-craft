/**
 * PURPOSE: Defines the structure of a project folder reference
 *
 * USAGE:
 * projectFolderContract.parse({name: 'ward', path: '/home/user/project/packages/ward'});
 * // Returns: ProjectFolder validated object
 */

import { z } from 'zod';

export const projectFolderContract = z.object({
  name: z.string().brand<'ProjectName'>(),
  path: z.string().brand<'ProjectPath'>(),
});

export type ProjectFolder = z.infer<typeof projectFolderContract>;
