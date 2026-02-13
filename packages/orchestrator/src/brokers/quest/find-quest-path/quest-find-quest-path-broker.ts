/**
 * PURPOSE: Finds the quest path and project ID for a given quest ID by scanning all projects in ~/.dungeonmaster/projects/
 *
 * USAGE:
 * const { questPath, projectId } = await questFindQuestPathBroker({ questId: QuestIdStub({ value: 'add-auth' }) });
 * // Returns: { questPath: AbsoluteFilePath, projectId: ProjectId } or throws if not found
 */

import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { fsReaddirWithTypesAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { projectIdContract, questContract } from '@dungeonmaster/shared/contracts';
import { fileNameContract } from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  FileName,
  FilePath,
  ProjectId,
  QuestId,
} from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';

const QUEST_FILE_NAME = 'quest.json';

export const questFindQuestPathBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ questPath: AbsoluteFilePath; projectId: ProjectId }> => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const projectsDir = pathJoinAdapter({
    paths: [homePath, dungeonmasterHomeStatics.paths.projectsDir],
  });

  const projectEntries = fsReaddirWithTypesAdapter({ dirPath: projectsDir as AbsoluteFilePath });
  const projectDirs = projectEntries.filter((entry) => entry.isDirectory());

  const candidates: {
    questFilePath: FilePath;
    questFolderPath: FilePath;
    projectDirName: FileName;
  }[] = [];

  for (const projectDir of projectDirs) {
    const questsDirPath = pathJoinAdapter({
      paths: [projectsDir, projectDir.name, dungeonmasterHomeStatics.paths.questsDir],
    });

    try {
      const questFolderEntries = fsReaddirWithTypesAdapter({
        dirPath: questsDirPath as AbsoluteFilePath,
      });

      const questFolders = questFolderEntries.filter((entry) => entry.isDirectory());

      for (const questFolder of questFolders) {
        candidates.push({
          questFilePath: pathJoinAdapter({
            paths: [questsDirPath, questFolder.name, QUEST_FILE_NAME],
          }),
          questFolderPath: pathJoinAdapter({
            paths: [questsDirPath, questFolder.name],
          }),
          projectDirName: fileNameContract.parse(projectDir.name),
        });
      }
    } catch {
      continue;
    }
  }

  const results = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        const contents = await fsReadFileAdapter({ filePath: candidate.questFilePath });
        const parsed: unknown = JSON.parse(contents);
        const quest = questContract.parse(parsed);

        if (quest.id === questId) {
          return {
            questPath: candidate.questFolderPath as AbsoluteFilePath,
            projectId: projectIdContract.parse(candidate.projectDirName),
          };
        }

        return null;
      } catch {
        return null;
      }
    }),
  );

  const match = results.find((result) => result !== null);

  if (match) {
    return match;
  }

  throw new Error(`Quest with id "${questId}" not found in any project`);
};
