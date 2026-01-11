/**
 * PURPOSE: Ensures the .dungeonmaster-quests folder exists, creating it if needed
 *
 * USAGE:
 * const { questsBasePath } = await questsFolderEnsureBroker();
 * // Creates folder if it doesn't exist, returns path
 */

import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

const QUESTS_FOLDER_NAME = '.dungeonmaster-quests';

export const questsFolderEnsureBroker = async (): Promise<{
  questsBasePath: FilePath;
}> => {
  // Build path
  const questsBasePath = pathJoinAdapter({ paths: [process.cwd(), QUESTS_FOLDER_NAME] });

  // Ensure quests folder exists (recursive: true handles parent dirs)
  await fsMkdirAdapter({ filepath: questsBasePath });

  return { questsBasePath };
};
