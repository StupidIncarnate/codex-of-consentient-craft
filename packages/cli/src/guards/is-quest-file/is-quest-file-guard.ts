/**
 * PURPOSE: Checks if a filename is a valid quest JSON file
 *
 * USAGE:
 * isQuestFileGuard({filename: 'add-auth.json'});
 * // Returns true if filename ends with .json
 */

import { questsFolderStatics } from '../../statics/quests-folder/quests-folder-statics';

export const isQuestFileGuard = ({ filename }: { filename?: string }): boolean => {
  if (!filename) {
    return false;
  }

  return filename.endsWith(questsFolderStatics.files.extension);
};
