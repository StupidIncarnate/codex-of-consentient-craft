/**
 * PURPOSE: Removes a quest folder from disk (~/.dungeonmaster/guilds/{guildId}/quests/{questId}/) and appends a quest-modified outbox event. Idempotent when the directory is already gone.
 *
 * USAGE:
 * await questDeleteBroker({ questId, guildId });
 * // Deletes the quest folder recursively, appends a quest-modified outbox line.
 */

import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, QuestId } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { rm } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';

import { questOutboxAppendBroker } from '../outbox-append/quest-outbox-append-broker';

export const questDeleteBroker = async ({
  questId,
  guildId,
}: {
  questId: QuestId;
  guildId: GuildId;
}): Promise<void> => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const questFolderPath = filePathContract.parse(
    join(
      homePath,
      dungeonmasterHomeStatics.paths.guildsDir,
      guildId,
      dungeonmasterHomeStatics.paths.questsDir,
      questId,
    ),
  );

  await rm(questFolderPath, { recursive: true, force: true });

  await questOutboxAppendBroker({ questId });
};
