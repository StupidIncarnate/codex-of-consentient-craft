/**
 * PURPOSE: Loads all active quests from a guild's quests directory
 *
 * USAGE:
 * await questListBroker({guildId: GuildIdStub()});
 * // Returns array of Quest objects from quest folders (e.g., 001-add-auth/quest.json)
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import type { GuildId, Quest } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { isQuestFolderGuard } from '../../../guards/is-quest-folder/is-quest-folder-guard';
import { questLoadBroker } from '../load/quest-load-broker';
import { questResolveQuestsPathBroker } from '../resolve-quests-path/quest-resolve-quests-path-broker';

export const questListBroker = async ({ guildId }: { guildId: GuildId }): Promise<Quest[]> => {
  const { questsPath } = questResolveQuestsPathBroker({ guildId });

  const entries = fsReaddirAdapter({ dirPath: questsPath });

  const questFolders = entries.filter((folderName) => isQuestFolderGuard({ folderName }));

  const quests = await Promise.all(
    questFolders.map(async (folderName) => {
      const questFilePath = pathJoinAdapter({
        paths: [questsPath, folderName, locationsStatics.quest.questFile],
      });
      return questLoadBroker({ questFilePath });
    }),
  );

  return quests;
};
