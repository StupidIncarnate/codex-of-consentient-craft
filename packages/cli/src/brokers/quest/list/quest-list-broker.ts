/**
 * PURPOSE: Loads all active quests from the .dungeonmaster-quests folder
 *
 * USAGE:
 * await questListBroker({startPath: FilePathStub({value: '/project/src/file.ts'})});
 * // Returns array of Quest objects
 */

import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { questsFolderFindBroker } from '../../quests-folder/find/quests-folder-find-broker';
import { questLoadBroker } from '../load/quest-load-broker';
import { isQuestFileGuard } from '../../../guards/is-quest-file/is-quest-file-guard';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import type { Quest } from '../../../contracts/quest/quest-contract';

export const questListBroker = async ({ startPath }: { startPath: FilePath }): Promise<Quest[]> => {
  const questsFolderPath = await questsFolderFindBroker({ startPath });

  const files = fsReaddirAdapter({ dirPath: questsFolderPath });

  const questFiles = files.filter((filename) => isQuestFileGuard({ filename }));

  const quests = await Promise.all(
    questFiles.map(async (filename) => {
      const questFilePath = pathJoinAdapter({ paths: [questsFolderPath, filename] });
      return questLoadBroker({ questFilePath });
    }),
  );

  return quests;
};
