/**
 * PURPOSE: Checks if a directory name is a valid quest folder (e.g., 001-quest-name)
 *
 * USAGE:
 * isQuestFolderGuard({folderName: '001-add-auth'});
 * // Returns true if folder matches quest folder pattern (NNN-name)
 */

const LEGACY_QUEST_FOLDER_PATTERN = /^\d{3}-/u;
const UUID_PATTERN = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/u;

export const isQuestFolderGuard = ({ folderName }: { folderName?: string }): boolean => {
  if (!folderName) {
    return false;
  }

  return LEGACY_QUEST_FOLDER_PATTERN.test(folderName) || UUID_PATTERN.test(folderName);
};
