/**
 * PURPOSE: Finds the .dungeonmaster-quests folder path and ensures it exists
 *
 * USAGE:
 * const { questsBasePath } = await questsFolderEnsureBroker({ startPath: FilePathStub({value: '/project/src/file.ts'}) });
 * // Creates folder if it doesn't exist, returns path
 */

import { ensureDir } from '#gateway/node/fs__promises';
import { questsFolderFindBroker } from '../find/quests-folder-find-broker';

export const questsFolderEnsureBroker = async ({
  startPath,
}: {
  startPath: string;
}): Promise<{ questsBasePath: string }> => {
  const questsBasePath = await questsFolderFindBroker({ startPath });

  await ensureDir(questsBasePath);

  return { questsBasePath };
};
