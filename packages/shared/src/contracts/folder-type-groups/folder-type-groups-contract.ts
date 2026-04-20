/**
 * PURPOSE: Validates a list of folder-type batch groups with no folder type appearing in more than one group
 *
 * USAGE:
 * folderTypeGroupsContract.parse([['contracts', 'statics'], ['guards', 'transformers']]);
 * // Returns branded FolderTypeGroups; emits curated default when input is undefined
 */

import { z } from 'zod';
import { defaultBatchGroupsStatics } from '../../statics/default-batch-groups/default-batch-groups-statics';
import type { FolderType } from '../folder-type/folder-type-contract';
import { folderTypeContract } from '../folder-type/folder-type-contract';

export const folderTypeGroupsContract = z
  .array(z.array(folderTypeContract).min(1))
  .refine(
    (groups) => {
      const seen = new Set<FolderType>();
      for (const group of groups) {
        for (const folderType of group) {
          if (seen.has(folderType)) {
            return false;
          }
          seen.add(folderType);
        }
      }
      return true;
    },
    { message: 'folder types may appear in at most one batch group' },
  )
  .default(defaultBatchGroupsStatics.value as unknown as FolderType[][])
  .brand<'FolderTypeGroups'>();

export type FolderTypeGroups = z.infer<typeof folderTypeGroupsContract>;
