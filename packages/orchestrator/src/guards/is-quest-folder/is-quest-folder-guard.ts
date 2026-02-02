/**
 * PURPOSE: Checks if a directory name is a valid quest folder (e.g., 001-quest-name)
 *
 * USAGE:
 * isQuestFolderGuard({folderName: '001-add-auth'});
 * // Returns true if folder matches quest folder pattern (NNN-name)
 */

const QUEST_FOLDER_PATTERN = /^\d{3}-/u;

export const isQuestFolderGuard = ({ folderName }: { folderName?: string }): boolean => {
  if (!folderName) {
    return false;
  }

  return QUEST_FOLDER_PATTERN.test(folderName);
};
