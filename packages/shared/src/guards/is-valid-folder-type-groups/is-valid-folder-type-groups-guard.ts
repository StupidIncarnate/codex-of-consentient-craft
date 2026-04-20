/**
 * PURPOSE: Checks a folder-type batch-group list has no duplicate folder types across groups
 *
 * USAGE:
 * isValidFolderTypeGroupsGuard([['contracts','statics'], ['guards']]);
 * // Returns true when every folder type appears in at most one group
 */

import type { FolderType } from '../../contracts/folder-type/folder-type-contract';

export const isValidFolderTypeGroupsGuard = ({
  groups,
}: {
  groups?: readonly (readonly FolderType[])[];
}): boolean => {
  if (groups === undefined) {
    return true;
  }
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
};
