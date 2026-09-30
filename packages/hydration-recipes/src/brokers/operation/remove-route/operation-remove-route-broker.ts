/**
 * PURPOSE: The operation ingredient's `remove` route — finds the owning quest, drops the matched
 * ledger item AND every work item whose `relatedDataItems` names it, then persists the whole quest
 * exactly as `questOperationsUpdateBroker` would. This is the route the specification's own worked
 * example runs on: `q[0].operations.filter({ where: { role: 'riftcarver' }, expect: 'one' }).remove()`.
 *
 * The linked work items go with it because a live target's START route mints the riftcarver
 * operation WITH its carve work item. Dropping only the operation leaves a `pending` carve row
 * pointing at nothing — the quest reads one step short of done, and a dispatcher that is played
 * later runs a riftcarver the recipe removed.
 *
 * USAGE:
 * await operationRemoveRouteBroker({ target, record: operation });
 * // Drops the matched item, and the work items that worked it, from the quest's ledger
 */
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { operationItemContract } from '@dungeonmaster/shared/contracts';

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
}): Promise<void> => {
  const operationItemId = operationItemContract.shape.id.parse(record.id);
  const quest = await operationOwningQuestFindBroker({ operationItemId });

  const operationRef = `operations/${String(operationItemId)}`;
  const updatedQuest = {
    ...quest,
    operations: quest.operations.filter((operation) => operation.id !== operationItemId),
    workItems: quest.workItems.filter(
      (workItem) => !workItem.relatedDataItems.some((ref) => String(ref) === operationRef),
    ),
  };

  const questFolderPath = await questFolderPathResolveBroker({ target, record: quest });
  const questFilePath = `${questFolderPath}/${locationsStatics.quest.questFile}`;

  return questPersistDirectBroker({
    target,
    questFilePath,
    contents: JSON.stringify(updatedQuest),
    questId: quest.id,
  });
};
