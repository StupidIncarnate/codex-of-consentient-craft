/**
 * PURPOSE: Layer of `questWorkRecordBroker` — replaces ONE work item's fields with `patch` (the
 * `observations`, `outcome` and `request` payloads each write a different subset), bumps the quest's
 * `updatedAt`, and persists through `questPersistBroker` — the outbox append that drives the
 * WebSocket `quest-modified` broadcast the browser re-renders on.
 *
 * USAGE:
 * await workItemPatchLayerBroker({ quest, questFilePath, questId, workItemId, patch: { observations: [...] }, nowAt });
 * // Persists the quest and returns the patched WorkItem
 */

import {
  fileContentsContract,
  questContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type {
  FilePath,
  Quest,
  QuestId,
  QuestWorkItemId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';

import type { IsoTimestamp } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import { questPersistBroker } from '../persist/quest-persist-broker';

const JSON_INDENT_SPACES = 2;

export const workItemPatchLayerBroker = async ({
  quest,
  questFilePath,
  questId,
  workItemId,
  patch,
  nowAt,
}: {
  quest: Quest;
  questFilePath: FilePath;
  questId: QuestId;
  workItemId: QuestWorkItemId;
  patch: Partial<WorkItem>;
  nowAt: IsoTimestamp;
}): Promise<WorkItem> => {
  const existingItem = quest.workItems.find((item) => item.id === workItemId);

  if (existingItem === undefined) {
    throw new Error(
      `workItemPatchLayerBroker: work item ${workItemId} is not on quest ${questId} — nothing was patched`,
    );
  }

  const patchedWorkItem = workItemContract.parse({ ...existingItem, ...patch });
  const nextWorkItems = quest.workItems.map((item) =>
    item.id === workItemId ? patchedWorkItem : item,
  );

  const updatedQuest = questContract.parse({
    ...quest,
    workItems: nextWorkItems,
    updatedAt: nowAt,
  });

  const questJson = fileContentsContract.parse(
    JSON.stringify(updatedQuest, null, JSON_INDENT_SPACES),
  );

  await questPersistBroker({ questFilePath, contents: questJson, questId });

  return patchedWorkItem;
};
