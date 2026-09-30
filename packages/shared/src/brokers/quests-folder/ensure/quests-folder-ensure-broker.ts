/**
 * PURPOSE: Finds the .dungeonmaster-quests folder path and ensures it exists
 *
 * USAGE:
 * const { questsBasePath } = await questsFolderEnsureBroker({ startPath: FilePathStub({value: '/project/src/file.ts'}) });
 * // Creates folder if it doesn't exist, returns path
 */

import { questsFolderEnsureResultContract } from '../../../contracts/quests-folder-ensure-result/quests-folder-ensure-result-contract';
import type { QuestsFolderEnsureResult } from '../../../contracts/quests-folder-ensure-result/quests-folder-ensure-result-contract';
import { ensureDir } from '#gateway/node/fs__promises';
import { questsFolderFindBroker } from '../find/quests-folder-find-broker';

export const questsFolderEnsureBroker = async ({
  startPath,
}: {
  startPath: string;
}): Promise<QuestsFolderEnsureResult> => {
  const questsBasePath = await questsFolderFindBroker({ startPath });

  await ensureDir(questsBasePath);

  return questsFolderEnsureResultContract.parse({ questsBasePath });
};
