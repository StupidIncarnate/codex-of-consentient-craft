/**
 * PURPOSE: Finds the .dungeonmaster-quests folder path and ensures it exists
 *
 * USAGE:
 * const { questsBasePath } = await questsFolderEnsureBroker({ startPath: FilePathStub({value: '/project/src/file.ts'}) });
 * // Creates folder if it doesn't exist, returns path
 */

import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import { questsFolderFindBroker } from '../find/quests-folder-find-broker';

export const questsFolderEnsureBroker = async ({
  startPath,
}: {
  startPath: FilePath;
}): Promise<{ questsBasePath: FilePath }> => {
  const questsBasePath = await questsFolderFindBroker({ startPath });

  await fsMkdirAdapter({ filepath: questsBasePath });

  return { questsBasePath };
};
