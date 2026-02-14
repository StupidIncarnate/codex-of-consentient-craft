/**
 * PURPOSE: Finds the quest path and guild ID for a given quest ID by scanning all guilds in ~/.dungeonmaster/guilds/
 *
 * USAGE:
 * const { questPath, guildId } = await questFindQuestPathBroker({ questId: QuestIdStub({ value: 'add-auth' }) });
 * // Returns: { questPath: AbsoluteFilePath, guildId: GuildId } or throws if not found
 */

import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { fsReaddirWithTypesAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { guildIdContract, questContract } from '@dungeonmaster/shared/contracts';
import { fileNameContract } from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  FileName,
  FilePath,
  GuildId,
  QuestId,
} from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';

const QUEST_FILE_NAME = 'quest.json';

export const questFindQuestPathBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ questPath: AbsoluteFilePath; guildId: GuildId }> => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const guildsDir = pathJoinAdapter({
    paths: [homePath, dungeonmasterHomeStatics.paths.guildsDir],
  });

  const guildEntries = fsReaddirWithTypesAdapter({ dirPath: guildsDir as AbsoluteFilePath });
  const guildDirs = guildEntries.filter((entry) => entry.isDirectory());

  const candidates: {
    questFilePath: FilePath;
    questFolderPath: FilePath;
    guildDirName: FileName;
  }[] = [];

  for (const guildDir of guildDirs) {
    const questsDirPath = pathJoinAdapter({
      paths: [guildsDir, guildDir.name, dungeonmasterHomeStatics.paths.questsDir],
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
          guildDirName: fileNameContract.parse(guildDir.name),
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
            guildId: guildIdContract.parse(candidate.guildDirName),
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

  throw new Error(`Quest with id "${questId}" not found in any guild`);
};
