/**
 * PURPOSE: The quest ingredient's `attachWorkItem` extra — appends ONE work item onto an
 * already-written quest, composing `relatedDataItems` from an operation id a SIBLING
 * `operations.add()` minted earlier in the SAME plan. Reach for this over a create-time `setRaw`
 * whenever a work item must reference a REAL minted operation id: `workItems` sits on NO status's
 * `questStatusInputAllowlistStatics` entry, so `questModifyBroker` refuses it at every status
 * (`quest-ingredient-broker.ts`'s own header) — this bypasses that gate the same way
 * `operationWriteRouteBroker` bypasses it for `operations`, re-reading the quest fresh (the row's
 * own in-memory `record` freezes at CREATE time and would miss whatever `operations.add()`
 * appended since — `packages/hydration-recipes/CLAUDE.md`'s "`saveRecordAs` freezes a row's record
 * at CREATE time" finding applies identically to an extra's `record` argument) and persisting
 * straight to the file, exactly like `operationWriteRouteBroker` does for its own append.
 *
 * `args.operationId` arrives ALREADY RESOLVED: `opExtraApplyLayerBroker` runs
 * `fieldValuesResolveTransformer` on `op.args` before calling this, so a `fromSavedRefTransformer`
 * value a recipe passed in is already the sibling operation's real id by the time it reaches here.
 *
 * USAGE:
 * await questWorkItemAttachBroker({
 *   target,
 *   record: quest,
 *   args: { role: 'codeweaver', status: 'complete', spawnerType: 'agent', createdAt, operationId },
 * });
 * // Appends one WorkItem onto quest.workItems on disk, relatedDataItems: ['operations/<operationId>']
 */
import { questGetBroker } from '@dungeonmaster/orchestrator/brokers';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  fileContentsContract,
  filePathContract,
  getQuestInputContract,
  operationItemIdContract,
  questIdContract,
  questWorkItemIdContract,
  relatedDataItemContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type { WorkItem } from '@dungeonmaster/shared/contracts';

import { questFolderPathResolveBroker } from '../folder-path-resolve/quest-folder-path-resolve-broker';
import { questPersistDirectBroker } from '../persist-direct/quest-persist-direct-broker';
import { workItemAttachArgsContract } from '../../../contracts/work-item-attach-args/work-item-attach-args-contract';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const questWorkItemAttachBroker = async ({
  target,
  record,
  args,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
  args: Record<string, unknown>;
}): Promise<WorkItem> => {
  const parsedArgs = workItemAttachArgsContract.parse(args);
  const { role, status, spawnerType, createdAt } = parsedArgs;
  // Re-parsed through the NARROW id contract rather than destructured straight off `parsedArgs`:
  // `operationId`'s declared type is `OperationItemId | SavedRef` (Q3's ruling — the args contract
  // types the pre-resolve chain call too), but `opExtraApplyLayerBroker` already resolved it
  // through `fieldValuesResolveTransformer` before calling here, so it is always a real id by now.
  const operationId = operationItemIdContract.parse(parsedArgs.operationId);
  const questId = questIdContract.parse(record.id);

  const getResult = await questGetBroker({ input: getQuestInputContract.parse({ questId }) });
  if (!getResult.success || !getResult.quest) {
    throw new Error(`questWorkItemAttachBroker: quest ${questId} not found`);
  }
  const { quest } = getResult;

  const newItem = workItemContract.parse({
    id: questWorkItemIdContract.parse(crypto.randomUUID()),
    role,
    status,
    spawnerType,
    createdAt,
    relatedDataItems: [relatedDataItemContract.parse(`operations/${operationId}`)],
  });
  const updatedQuest = { ...quest, workItems: [...quest.workItems, newItem] };

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
