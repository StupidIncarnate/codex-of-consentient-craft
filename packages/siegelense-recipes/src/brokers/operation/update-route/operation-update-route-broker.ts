/**
 * PURPOSE: The operation ingredient's `update` route — finds the owning quest via
 * `operationOwningQuestFindBroker`, replaces the matched ledger item, then persists the whole
 * quest exactly as `questOperationsUpdateBroker` would.
 *
 * USAGE:
 * await operationUpdateRouteBroker({ target, record: operation, fields: { text: 'noop' } });
 * // Returns the updated OperationItem
 */
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  fileContentsContract,
  filePathContract,
  operationItemContract,
  operationItemIdContract,
} from '@dungeonmaster/shared/contracts';
import type { OperationItem } from '@dungeonmaster/shared/contracts';

import { operationOwningQuestFindBroker } from '../owning-quest-find/operation-owning-quest-find-broker';
import { questFolderPathResolveBroker } from '../../quest/folder-path-resolve/quest-folder-path-resolve-broker';
import { questPersistDirectBroker } from '../../quest/persist-direct/quest-persist-direct-broker';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const operationUpdateRouteBroker = async ({
  target,
  record,
  fields,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
  fields: Record<string, unknown>;
}): Promise<OperationItem> => {
  const operationItemId = operationItemIdContract.parse(record.id);
  const quest = await operationOwningQuestFindBroker({ operationItemId });

  const updatedItem = operationItemContract.parse({ ...record, ...fields });
  const updatedOperations = quest.operations.map((operation) =>
    operation.id === operationItemId ? updatedItem : operation,
  );
  const updatedQuest = { ...quest, operations: updatedOperations };

  const questFolderPath = await questFolderPathResolveBroker({ target, record: quest });
  const questFilePath = filePathContract.parse(
    `${questFolderPath}/${locationsStatics.quest.questFile}`,
  );

  await questPersistDirectBroker({
    target,
    questFilePath,
    contents: fileContentsContract.parse(JSON.stringify(updatedQuest)),
    questId: quest.id,
  });

  return updatedItem;
};
