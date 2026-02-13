/**
 * PURPOSE: Loads all active quests from a project's quests directory
 *
 * USAGE:
 * await questListBroker({projectId: ProjectIdStub()});
 * // Returns array of Quest objects from quest folders (e.g., 001-add-auth/quest.json)
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import type { ProjectId, Quest } from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { isQuestFolderGuard } from '../../../guards/is-quest-folder/is-quest-folder-guard';
import { questLoadBroker } from '../load/quest-load-broker';
import { questResolveQuestsPathBroker } from '../resolve-quests-path/quest-resolve-quests-path-broker';

const QUEST_FILE_NAME = 'quest.json';

export const questListBroker = async ({
  projectId,
}: {
  projectId: ProjectId;
}): Promise<Quest[]> => {
  const { questsPath } = questResolveQuestsPathBroker({ projectId });

  const entries = fsReaddirAdapter({ dirPath: questsPath });

  const questFolders = entries.filter((folderName) => isQuestFolderGuard({ folderName }));

  const quests = await Promise.all(
    questFolders.map(async (folderName) => {
      const questFilePath = pathJoinAdapter({
        paths: [questsPath, folderName, QUEST_FILE_NAME],
      });
      return questLoadBroker({ questFilePath });
    }),
  );

  return quests;
};
