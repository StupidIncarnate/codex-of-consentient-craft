/**
 * PURPOSE: The operation ingredient's `write` route — appends one item onto the linked quest's
 * operations ledger, then persists the whole quest exactly as `questOperationsUpdateBroker` would.
 * Reaches `questGetBroker` BY PATH from the orchestrator's `/brokers` subpath rather than through
 * `StartOrchestrator` on the main barrel: importing anything from that barrel evaluates
 * `startup/start-orchestrator.ts`, which boots a rate-limits watcher and a stale-process watchdog
 * at module scope, and this package is a short-lived hydration tool, not the long-running server
 * those exist for.
 *
 * `questOperationsUpdateBroker` itself is unreachable from this package (internal to
 * `@dungeonmaster/orchestrator`, absent from every export surface) — this reimplements its
 * append-then-persist effect via `questPersistDirectBroker`, the same reimplementation the quest
 * `write` route already carries for the identical reason.
 *
 * USAGE:
 * await operationWriteRouteBroker({ target, fields: { text, role, status, questId, guildId } });
 * // Returns the new OperationItem, appended onto the quest's operations array on disk
 */
import { questGetBroker } from '@dungeonmaster/orchestrator/brokers';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  fileContentsContract,
  filePathContract,
  getQuestInputContract,
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
  const getResult = await questGetBroker({ input: getQuestInputContract.parse({ questId }) });

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
