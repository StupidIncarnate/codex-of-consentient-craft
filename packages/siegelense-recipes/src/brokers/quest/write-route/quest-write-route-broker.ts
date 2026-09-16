/**
 * PURPOSE: The quest ingredient's `write` route — assembles a full quest object from the
 * caller's fields, then persists it exactly as `questPersistBroker` would (atomic write, outbox
 * append) via `questPersistDirectBroker`. Reach for this over `questUserAddBroker`/
 * `questHydrateBroker`: neither accepts a caller-chosen `status` alongside caller-chosen
 * `workItems`/`operations` with literal ids the caller's own assertions reference, which is what
 * 259 real `writeQuestFile` call sites need — this route bypasses every status-transition gate
 * the same way that harness method does, deliberately.
 *
 * `id` and `folder` are minted here with `crypto.randomUUID()`, not in `defaults(index)` — both
 * are `quest`'s own `volatile` fields (server-minted, absent from `fields`), so calling
 * `crypto.randomUUID()` in THIS file (not a `*-ingredient.ts` file) never trips
 * `ban-nondeterminism-in-ingredients`, and a two-route comparison test projects both away before
 * comparing. `folder` reuses the same minted id rather than a slugified name: nothing downstream
 * in this package reads a quest's folder name, and `questPersistDirectBroker` only needs a real
 * `questFilePath`.
 *
 * USAGE:
 * await questWriteRouteBroker({ target, fields: { title, userRequest, status, guildId, … } });
 * // Returns the full Quest record, written to <target.home>/guilds/<guildId>/quests/<id>/quest.json
 */
import { fsMkdirAdapter } from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import {
  fileContentsContract,
  filePathContract,
  questContract,
  questIdContract,
} from '@dungeonmaster/shared/contracts';
import type { Quest } from '@dungeonmaster/shared/contracts';

import { questPersistDirectBroker } from '../persist-direct/quest-persist-direct-broker';
import { questFieldsContract } from '../../../contracts/quest-fields/quest-fields-contract';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const questWriteRouteBroker = async ({
  target,
  fields,
}: {
  target: DmTarget;
  fields: Record<string, unknown>;
}): Promise<Quest> => {
  const parsedFields = questFieldsContract.parse(fields);
  const id = questIdContract.parse(crypto.randomUUID());
  const folder = questContract.shape.folder.parse(id);
  const createdAt = questContract.shape.createdAt.parse(new Date().toISOString());

  const quest = questContract.parse({ ...parsedFields, id, folder, createdAt });

  const questFolderPath = `${target.home}/${dungeonmasterHomeStatics.paths.guildsDir}/${parsedFields.guildId}/${dungeonmasterHomeStatics.paths.questsDir}/${folder}`;
  const questFilePath = filePathContract.parse(
    `${questFolderPath}/${dungeonmasterHomeStatics.paths.questFile}`,
  );

  await fsMkdirAdapter({ filepath: filePathContract.parse(questFolderPath) });
  await questPersistDirectBroker({
    target,
    questFilePath,
    contents: fileContentsContract.parse(JSON.stringify(quest)),
    questId: id,
  });

  return quest;
};
