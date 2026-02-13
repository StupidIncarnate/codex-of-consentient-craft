/**
 * PURPOSE: Defines a filesystem directory listing entry with name, path, and type information
 *
 * USAGE:
 * directoryEntryContract.parse({name: 'my-folder', path: '/home/user/my-folder', isDirectory: true});
 * // Returns: DirectoryEntry object
 */

import { z } from 'zod';

import { projectPathContract } from '../project-path/project-path-contract';

export const directoryEntryContract = z.object({
  name: z.string().min(1).brand<'DirectoryEntryName'>(),
  path: projectPathContract,
  isDirectory: z.boolean(),
});

export type DirectoryEntry = z.infer<typeof directoryEntryContract>;
