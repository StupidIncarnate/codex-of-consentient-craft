/**
 * PURPOSE: Removes a quest folder from disk (~/.dungeonmaster/guilds/{guildId}/quests/{questId}/) and appends a quest-modified outbox event. Idempotent when the directory is already gone.
 *
 * USAGE:
 * await questDeleteBroker({ questId, guildId });
 * // Deletes the quest folder recursively, appends a quest-modified outbox line.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, QuestId } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';

import { fsRmAdapter } from '../../../adapters/fs/rm/fs-rm-adapter';
import { questOutboxAppendBroker } from '../outbox-append/quest-outbox-append-broker';

export const questDeleteBroker = async ({
  questId,
  guildId,
}: {
  questId: QuestId;
  guildId: GuildId;
}): Promise<{ success: true }> => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const questFolderPath = filePathContract.parse(
    pathJoinAdapter({
      paths: [
        homePath,
        dungeonmasterHomeStatics.paths.guildsDir,
        guildId,
        dungeonmasterHomeStatics.paths.questsDir,
        questId,
      ],
    }),
  );

  await fsRmAdapter({
    filePath: questFolderPath,
    recursive: true,
    force: true,
  });

  await questOutboxAppendBroker({ questId });

  return { success: true as const };
};
