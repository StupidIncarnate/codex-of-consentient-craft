/**
 * PURPOSE: The `quest` command's per-work-item index needs the ledger `questLoadBroker` never
 * loads — `operations[]` for the text/flows/packages a work item's `relatedDataItems` join
 * resolves to, `wardResults[]`/`riftcarverResults[]` for the same join, and the quest's own
 * `userRequest`, printed once at the top. `questLoadBroker` stays scoped to `flows`/`workItems`
 * for `coverage`, which never touches any of these four; this is the sibling projection for the
 * one command that needs them instead. Reach for this over reading the file yourself.
 *
 * USAGE:
 * questIndexLoadBroker({ questId: QuestIdStub() });
 * // Returns { userRequest, workItems, operations, wardResults, riftcarverResults } for that quest.
 * // Every array fails independently and userRequest is undefined when missing or invalid — same
 * // resilience as questLoadBroker. Everything comes back empty/undefined when the quest cannot be
 * // found or its file cannot be parsed as JSON at all.
 */

import { fsReadFileSyncAdapter } from '@dungeonmaster/shared/adapters';
import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';
import {
  contentTextContract,
  workItemContract,
  operationItemContract,
  wardResultContract,
  riftcarverResultContract,
} from '@dungeonmaster/shared/contracts';
import type {
  QuestId,
  ContentText,
  WorkItem,
  OperationItem,
  WardResult,
  RiftcarverResult,
} from '@dungeonmaster/shared/contracts';
import { questFindBroker } from '../find/quest-find-broker';

export const questIndexLoadBroker = ({
  questId,
}: {
  questId: QuestId;
}): {
  userRequest: ContentText | undefined;
  workItems: readonly WorkItem[];
  operations: readonly OperationItem[];
  wardResults: readonly WardResult[];
  riftcarverResults: readonly RiftcarverResult[];
} => {
  const empty = {
    userRequest: undefined,
    workItems: [],
    operations: [],
    wardResults: [],
    riftcarverResults: [],
  };
  const questPath = questFindBroker({ questId });

  if (questPath === undefined) {
    return empty;
  }

  const contents = fsReadFileSyncAdapter({ filePath: questPath });
  const parsed = safeJsonParseTransformer({ value: contents });

  if (!parsed.ok) {
    return empty;
  }

  const questJson = parsed.value;

  if (typeof questJson !== 'object' || questJson === null) {
    return empty;
  }

  const userRequestResult =
    'userRequest' in questJson ? contentTextContract.safeParse(questJson.userRequest) : undefined;
  const workItemsResult =
    'workItems' in questJson ? workItemContract.array().safeParse(questJson.workItems) : undefined;
  const operationsResult =
    'operations' in questJson
      ? operationItemContract.array().safeParse(questJson.operations)
      : undefined;
  const wardResultsResult =
    'wardResults' in questJson
      ? wardResultContract.array().safeParse(questJson.wardResults)
      : undefined;
  const riftcarverResultsResult =
    'riftcarverResults' in questJson
      ? riftcarverResultContract.array().safeParse(questJson.riftcarverResults)
      : undefined;

  return {
    userRequest: userRequestResult?.success === true ? userRequestResult.data : undefined,
    workItems: workItemsResult?.success === true ? workItemsResult.data : [],
    operations: operationsResult?.success === true ? operationsResult.data : [],
    wardResults: wardResultsResult?.success === true ? wardResultsResult.data : [],
    riftcarverResults:
      riftcarverResultsResult?.success === true ? riftcarverResultsResult.data : [],
  };
};
