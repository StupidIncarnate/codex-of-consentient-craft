/**
 * PURPOSE: Recovers a failed Siegemaster work item — splices a spiritmender (fed the manual-QA
 *   finding via a sidecar) + a ward(changed) gate + a fresh siegemaster retry, rewiring downstream
 *   dependents onto the retry. Exhausted budget routes to BLOCK. Mirrors the ward RECOVER path.
 *
 * USAGE:
 * await questRecoverSiegeBroker({ questId, failedWorkItemId, finding });
 * // Budget remaining -> splice [spiritmender, ward(changed)] + fresh siege retry; quest stays
 * //   in_progress. Budget exhausted -> questBlockOnFailureBroker. Idempotent on a double signal-back.
 *
 * WHEN-TO-USE: From the signal-back handler when a `siegemaster` work item signals `failed`.
 * WHEN-NOT-TO-USE: For other roles — they BLOCK (or, for ward, recover via questRunWardBroker).
 */

import { fsMkdirAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  errorMessageContract,
  fileContentsContract,
  filePathContract,
  getQuestInputContract,
  workItemContract,
  type QuestId,
  type QuestWorkItemId,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { spiritmenderContextStatics } from '../../../statics/spiritmender-context/spiritmender-context-statics';
import { questBlockOnFailureBroker } from '../block-on-failure/quest-block-on-failure-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questSpliceFixerBroker } from '../splice-fixer/quest-splice-fixer-broker';

const SPIRITMENDER_BATCHES_DIR = 'spiritmender-batches';

// Spiritmender investigates and discovers the affected files from the finding, then ward-verifies
// the files it touched — the placeholder mirrors the siegemasterFailure context's own guidance.
const SIEGE_VERIFICATION_COMMAND = 'npm run ward -- -- <the files you fixed>';

const SIEGE_NO_FINDING_FALLBACK =
  'Siegemaster manual QA failed without a finding summary — re-run the flow by hand, reproduce the break (or false-positive green test), and fix the root cause.';

export const questRecoverSiegeBroker = async ({
  questId,
  failedWorkItemId,
  finding,
}: {
  questId: QuestId;
  failedWorkItemId: QuestWorkItemId;
  finding?: WorkItem['summary'];
}): Promise<{ recovered: boolean }> => {
  const getResult = await questGetBroker({ input: getQuestInputContract.parse({ questId }) });
  if (!getResult.success || getResult.quest === undefined) {
    return { recovered: false };
  }
  const { quest } = getResult;

  // Idempotency: a double signal-back can't double-splice. questSpliceFixerBroker guards on the
  // same predicate, but checking here also keeps the exhaustion BLOCK from re-running.
  if (quest.workItems.some((workItem) => workItem.insertedBy === failedWorkItemId)) {
    return { recovered: true };
  }

  const siegeItem = quest.workItems.find((workItem) => workItem.id === failedWorkItemId);
  if (siegeItem === undefined) {
    return { recovered: false };
  }

  // Budget exhausted — BLOCK the quest (drain pending to skipped, set status blocked).
  if (siegeItem.attempt >= siegeItem.maxAttempts - 1) {
    await questBlockOnFailureBroker({ questId, failedWorkItemId });
    return { recovered: false };
  }

  const createdAt = new Date().toISOString();

  // 1. Spiritmender — fixes the implementation and corrects any false-positive test (red-first).
  const spiritmenderItem = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'spiritmender',
    status: 'pending',
    spawnerType: 'agent',
    dependsOn: [failedWorkItemId],
    maxAttempts: 1,
    createdAt,
    insertedBy: failedWorkItemId,
  });

  // 2. Write the finding sidecar (same shape agentPromptGetBroker reads for spiritmender batches).
  //    Siegemaster has no modify-quest access, so its finding rides signal-back's summary into here.
  const { questPath } = await questFindQuestPathBroker({ questId });
  const batchesDir = pathJoinAdapter({ paths: [questPath, SPIRITMENDER_BATCHES_DIR] });
  await fsMkdirAdapter({ filepath: batchesDir });
  const batchFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [batchesDir, `${String(spiritmenderItem.id)}.json`] }),
  );
  const findingText =
    finding !== undefined && String(finding).length > 0
      ? String(finding)
      : SIEGE_NO_FINDING_FALLBACK;
  const batchContents = JSON.stringify({
    filePaths: [],
    errors: [errorMessageContract.parse(findingText)],
    verificationCommand: SIEGE_VERIFICATION_COMMAND,
    contextInstructions: spiritmenderContextStatics.siegemasterFailure.instructions,
  });
  await fsWriteFileAdapter({
    filePath: batchFilePath,
    contents: fileContentsContract.parse(batchContents),
  });

  // 3. Ward(changed) gate — the spiritmender just edited code, so prove the build is green before a
  //    fresh siege hand-QAs it. Its own retry budget catches any residual breakage.
  const wardItem = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'ward',
    status: 'pending',
    spawnerType: 'command',
    dependsOn: [spiritmenderItem.id],
    attempt: 0,
    maxAttempts: slotManagerStatics.ward.maxRetries,
    createdAt,
    insertedBy: failedWorkItemId,
    wardMode: 'changed',
  });

  // 4. Fresh siegemaster retry — re-runs the whole manual-QA pass on the same flow, attempt + 1.
  const newSiegeItem = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'siegemaster',
    status: 'pending',
    spawnerType: 'agent',
    relatedDataItems: siegeItem.relatedDataItems,
    dependsOn: [wardItem.id],
    attempt: siegeItem.attempt + 1,
    maxAttempts: siegeItem.maxAttempts,
    createdAt,
    insertedBy: failedWorkItemId,
  });

  await questSpliceFixerBroker({
    questId,
    quest,
    failedWorkItemId,
    fixerItems: [spiritmenderItem, wardItem],
    retryItem: newSiegeItem,
  });

  return { recovered: true };
};
