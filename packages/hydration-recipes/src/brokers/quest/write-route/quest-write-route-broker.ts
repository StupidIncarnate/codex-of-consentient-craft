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
 * EVERY PATH THIS ROUTE TOUCHES RESOLVES INSIDE `target.home`, and a `folder` that escapes it is
 * REFUSED rather than written. `questContract.shape.folder` is `z.string().min(1)`, so a caller's
 * `folder` may carry `..` segments or a leading `/`; joined raw, either walks the quest file out of
 * the target and into whatever sits above it — a seed that reports success while the test reads an
 * empty target, and the operator's own `~/.dungeonmaster` when the target IS that. Unlike a
 * guild's `path`, no quest file has a legitimate home outside the target, so this throws naming
 * the resolved path instead of quietly writing nothing. `pathResolveAdapter` rather than a bare
 * prefix test: `<home>/guilds/<id>/quests/../../..` starts with `target.home` and resolves above it.
 *
 * USAGE:
 * await questWriteRouteBroker({ target, fields: { title, userRequest, status, guildId, … } });
 * // Returns the full Quest record, written to <target.home>/guilds/<guildId>/quests/<id>/quest.json
 */
import { fsMkdirAdapter, pathResolveAdapter } from '@dungeonmaster/shared/adapters';
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
  const id = questIdContract.parse(fields.id ?? crypto.randomUUID());
  const folder = questContract.shape.folder.parse(fields.folder ?? id);
  const createdAt = questContract.shape.createdAt.parse(
    fields.createdAt ?? new Date().toISOString(),
  );

  const quest = questContract.parse({ ...parsedFields, id, folder, createdAt });

  const targetRoot = pathResolveAdapter({ paths: [target.home] });
  const questFolderPath = pathResolveAdapter({
    paths: [
      target.home,
      dungeonmasterHomeStatics.paths.guildsDir,
      parsedFields.guildId,
      dungeonmasterHomeStatics.paths.questsDir,
      folder,
    ],
  });

  if (!questFolderPath.startsWith(`${targetRoot}/`)) {
    throw new Error(
      `questWriteRouteBroker: folder "${folder}" resolves to "${questFolderPath}", outside the target home "${targetRoot}"`,
    );
  }

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
