/**
 * PURPOSE: Loads all loadable quests from a guild's quests directory
 *
 * USAGE:
 * await questListBroker({guildId: GuildIdStub()});
 * // Returns array of Quest objects from quest folders (e.g., 001-add-auth/quest.json)
 *
 * FAULT ISOLATION: a quest file that fails to read or fails questContract is SKIPPED, not
 * thrown. This is the guild-wide enumeration every orchestration surface reads through —
 * questActiveQuestsBroker (the dispatcher's active-quest scan AND the /queue list), the play
 * gate, orphan reset, work-item/session lookup. Throwing on one bad file removes every OTHER
 * quest in the guild from all of them, which strands an in_progress quest with the dispatcher
 * permanently idle. Each skip is written to stderr naming the file and the rejected field, so a
 * dropped quest is never silent.
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

  const loaded = await Promise.all(
    questFolders.map(async (folderName): Promise<Quest | null> => {
      const questFilePath = pathJoinAdapter({
        paths: [questsPath, folderName, locationsStatics.quest.questFile],
      });
      try {
        return await questLoadBroker({ questFilePath });
      } catch (error: unknown) {
        // questLoadBroker's message already names the file and the rejected field.
        const reason = error instanceof Error ? error.message : String(error);
        process.stderr.write(`[quest-list] skipping unloadable quest — ${reason}\n`);
        return null;
      }
    }),
  );

  return loaded.filter((quest): quest is Quest => quest !== null);
};
