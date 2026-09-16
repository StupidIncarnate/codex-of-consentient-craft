/**
 * PURPOSE: The operation ingredient's `write` route — appends one item onto the linked quest's
 * operations ledger, then persists the whole quest exactly as `questOperationsUpdateBroker` would.
 * Reach for `StartOrchestrator.getQuest` (property-style) rather than the bare `questGetBroker`
 * export: combining a bare named export mock with a `StartOrchestrator.<method>` property mock in
 * one test does not compose reliably (see `quest-owning-guild-find-broker.ts`'s own header for the
 * measurement) — every operation route stays property-only so its proxy composes cleanly with
 * `questFolderPathResolveBroker`, which is property-only too.
 *
 * `questOperationsUpdateBroker` itself is unreachable from this package (internal to
 * `@dungeonmaster/orchestrator`, absent from its `src/index.ts`) — this reimplements its
 * append-then-persist effect via `questPersistDirectBroker`, the same reimplementation the quest
 * `write` route already carries for the identical reason.
 *
 * USAGE:
 * await operationWriteRouteBroker({ target, fields: { text, role, status, questId, guildId } });
 * // Returns the new OperationItem, appended onto the quest's operations array on disk
 */
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  fileContentsContract,
  filePathContract,
  operationItemContract,
} from '@dungeonmaster/shared/contracts';
import type { OperationItem } from '@dungeonmaster/shared/contracts';

import { questFolderPathResolveBroker } from '../../quest/folder-path-resolve/quest-folder-path-resolve-broker';
import { questPersistDirectBroker } from '../../quest/persist-direct/quest-persist-direct-broker';
import { operationFieldsContract } from '../../../contracts/operation-fields/operation-fields-contract';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const operationWriteRouteBroker = async ({
  target,
  fields,
}: {
  target: DmTarget;
  fields: Record<string, unknown>;
}): Promise<OperationItem> => {
  const { questId, ...operationInput } = operationFieldsContract.parse(fields);
  const getResult = await StartOrchestrator.getQuest({ questId });

  if (!getResult.success || !getResult.quest) {
    throw new Error(`operationWriteRouteBroker: quest ${questId} not found`);
  }

  const { quest } = getResult;
  const newItem = operationItemContract.parse({ ...operationInput, id: crypto.randomUUID() });
  const updatedQuest = { ...quest, operations: [...quest.operations, newItem] };

  const questFolderPath = await questFolderPathResolveBroker({ target, record: quest });
  const questFilePath = filePathContract.parse(
    `${questFolderPath}/${locationsStatics.quest.questFile}`,
  );

  await questPersistDirectBroker({
    target,
    questFilePath,
    contents: fileContentsContract.parse(JSON.stringify(updatedQuest)),
    questId,
  });

  return newItem;
};
