/**
 * PURPOSE: Resolves the absolute folder a quest record lives in, for an extra that needs to touch
 * a sibling file (a corrupted quest.json, a `ward-results/<id>.json` detail blob) rather than go
 * through a route. Reach for this over recomputing the path inline: a quest's parent is its
 * FOLDER, not a field on the record, so the owning guild has to be found the same way the
 * `remove` route finds it — through `questOwningGuildFindBroker` — before the path can be built.
 *
 * USAGE:
 * await questFolderPathResolveBroker({ target, record: quest });
 * // Returns '<target.home>/guilds/<guildId>/quests/<folder>'
 */
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { filePathContract, questContract, questIdContract } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { questOwningGuildFindBroker } from '../owning-guild-find/quest-owning-guild-find-broker';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const questFolderPathResolveBroker = async ({
  target,
  record,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
}): Promise<FilePath> => {
  const questId = questIdContract.parse(record.id);
  const folder = questContract.shape.folder.parse(record.folder);
  const guildId = await questOwningGuildFindBroker({ questId });

  return filePathContract.parse(
    `${target.home}/${dungeonmasterHomeStatics.paths.guildsDir}/${guildId}/${dungeonmasterHomeStatics.paths.questsDir}/${folder}`,
  );
};
