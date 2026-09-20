/**
 * PURPOSE: The operation ingredient's `remove` route — finds the owning quest, drops the matched
 * ledger item, then persists the whole quest exactly as `questOperationsUpdateBroker` would. This
 * is the route the specification's own worked example runs on:
 * `q[0].operations.filter({ where: { role: 'riftcarver' }, expect: 'one' }).remove()`.
 *
 * USAGE:
 * await operationRemoveRouteBroker({ target, record: operation });
 * // Drops the matched item from the quest's operations ledger
 */
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  fileContentsContract,
  filePathContract,
  operationItemIdContract,
} from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { operationOwningQuestFindBroker } from '../owning-quest-find/operation-owning-quest-find-broker';
import { questFolderPathResolveBroker } from '../../quest/folder-path-resolve/quest-folder-path-resolve-broker';
import { questPersistDirectBroker } from '../../quest/persist-direct/quest-persist-direct-broker';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const operationRemoveRouteBroker = async ({
  target,
  record,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
}): Promise<AdapterResult> => {
  const operationItemId = operationItemIdContract.parse(record.id);
  const quest = await operationOwningQuestFindBroker({ operationItemId });

  const updatedQuest = {
    ...quest,
    operations: quest.operations.filter((operation) => operation.id !== operationItemId),
  };

  const questFolderPath = await questFolderPathResolveBroker({ target, record: quest });
  const questFilePath = filePathContract.parse(
    `${questFolderPath}/${locationsStatics.quest.questFile}`,
  );

  return questPersistDirectBroker({
    target,
    questFilePath,
    contents: fileContentsContract.parse(JSON.stringify(updatedQuest)),
    questId: quest.id,
  });
};
