/**
 * PURPOSE: Finds a quest folder by scanning .dungeonmaster-quests folders and matching quest.json files by quest ID
 *
 * USAGE:
 * const result = await questFolderFindBroker({ questId: 'add-auth', questsPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }) });
 * // Returns: { found: true, folderPath: '/project/.dungeonmaster-quests/001-add-auth', quest: {...} }
 * // Or: { found: false }
 */

import { filePathContract, questContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, Quest, QuestId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { join } from '#gateway/node/path';

import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import type { QuestFolderFindResult } from '../../../contracts/quest-folder-find-result/quest-folder-find-result-contract';

export const questFolderFindBroker = async ({
  questId,
  questsPath,
}: {
  questId: QuestId;
  questsPath: FilePath;
}): Promise<QuestFolderFindResult> => {
  const folders = fsReaddirAdapter({ dirPath: questsPath });

  const folderPaths = folders.map((folder) => ({
    folder,
    folderPath: filePathContract.parse(join(questsPath, folder)),
  }));

  const questFileResults = await Promise.all(
    folderPaths.map(async ({ folder: _folder, folderPath }) => {
      const questFilePath = filePathContract.parse(
        join(folderPath, locationsStatics.quest.questFile),
      );
      try {
        const contents = await fsReadFileAdapter({ filePath: questFilePath });
        const parsed: unknown = JSON.parse(contents);
        const quest = questContract.parse(parsed);
        return { folderPath, quest };
      } catch {
        return null;
      }
    }),
  );

  const validResults = questFileResults.filter(
    (result): result is { folderPath: FilePath; quest: Quest } => result !== null,
  );

  const match = validResults.find((result) => result.quest.id === questId);

  if (match) {
    return {
      found: true,
      folderPath: match.folderPath,
      quest: match.quest,
    };
  }

  return { found: false, folderPath: undefined, quest: undefined };
};
