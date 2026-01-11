/**
 * PURPOSE: Ensures the .dungeonmaster-quests folder and db.json exist, creating them if needed
 *
 * USAGE:
 * const { questsBasePath, dbPath } = await questsFolderEnsureBroker();
 * // Creates folder and empty database if they don't exist, returns paths
 */

import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

const QUESTS_FOLDER_NAME = '.dungeonmaster-quests';
const DB_FILE_NAME = 'db.json';
const JSON_INDENT_SPACES = 2;
const EMPTY_DATABASE = { quests: [] };

export const questsFolderEnsureBroker = async (): Promise<{
  questsBasePath: FilePath;
  dbPath: FilePath;
}> => {
  // Build paths
  const questsBasePath = pathJoinAdapter({ paths: [process.cwd(), QUESTS_FOLDER_NAME] });
  const dbPath = pathJoinAdapter({ paths: [questsBasePath, DB_FILE_NAME] });

  // Ensure quests folder exists (recursive: true handles parent dirs)
  await fsMkdirAdapter({ filepath: questsBasePath });

  // Check if db.json exists by trying to read it
  try {
    await fsReadFileAdapter({ filepath: dbPath });
  } catch {
    // File doesn't exist, create it with empty database
    const emptyDbContent = fileContentsContract.parse(
      JSON.stringify(EMPTY_DATABASE, null, JSON_INDENT_SPACES),
    );
    await fsWriteFileAdapter({ filepath: dbPath, contents: emptyDbContent });
  }

  return { questsBasePath, dbPath };
};
