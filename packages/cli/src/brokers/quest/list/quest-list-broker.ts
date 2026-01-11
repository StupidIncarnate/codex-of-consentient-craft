/**
 * PURPOSE: Loads all active quests from the .dungeonmaster-quests folder
 *
 * USAGE:
 * await questListBroker({startPath: FilePathStub({value: '/project/src/file.ts'})});
 * // Returns array of Quest objects from quest folders (e.g., 001-add-auth/quest.json)
 */

import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { questsFolderEnsureBroker } from '@dungeonmaster/shared/brokers';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { questLoadBroker } from '../load/quest-load-broker';
import { isQuestFolderGuard } from '../../../guards/is-quest-folder/is-quest-folder-guard';
import type { FilePath, Quest } from '@dungeonmaster/shared/contracts';

const QUEST_FILE_NAME = 'quest.json';

export const questListBroker = async ({ startPath }: { startPath: FilePath }): Promise<Quest[]> => {
  const { questsBasePath } = await questsFolderEnsureBroker({ startPath });

  const entries = fsReaddirAdapter({ dirPath: questsBasePath });

  const questFolders = entries.filter((folderName) => isQuestFolderGuard({ folderName }));

  const quests = await Promise.all(
    questFolders.map(async (folderName) => {
      const questFilePath = pathJoinAdapter({
        paths: [questsBasePath, folderName, QUEST_FILE_NAME],
      });
      return questLoadBroker({ questFilePath });
    }),
  );

  return quests;
};
