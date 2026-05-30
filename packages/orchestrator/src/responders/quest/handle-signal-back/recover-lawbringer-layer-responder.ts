/**
 * PURPOSE: Lawbringer-failure RECOVER path for the signal-back handler. Builds a spiritmender
 * batch sidecar from the failed lawbringer's failure summary (there is NO structured
 * ward-detail here), then splices a spiritmender + a lawbringer-retry via
 * `questSpliceFixerBroker` — which rewires downstream (blightwarden) onto the retry and keeps
 * the quest `in_progress`.
 *
 * The sidecar is written at the PINNED path `<questDir>/spiritmender-batches/<spiritmenderId>.json`
 * — the same convention the ward broker uses — so `agentPromptGetBroker` can read it when the
 * spiritmender is dispatched. `filePaths: []` routes the spiritmender prompt down its
 * "no files listed → investigate" path.
 *
 * USAGE:
 * await RecoverLawbringerLayerResponder({ questId, failedItem });
 * // Writes spiritmender-batches/<spiritmenderId>.json and splices spiritmender + lawbringer-retry.
 */

import { fsMkdirAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import type { AdapterResult, QuestId, WorkItem } from '@dungeonmaster/shared/contracts';
import {
  adapterResultContract,
  errorMessageContract,
  fileContentsContract,
  filePathContract,
  getQuestInputContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';

import { spiritmenderBatchContract } from '../../../contracts/spiritmender-batch/spiritmender-batch-contract';
import { spiritmenderContextStatics } from '../../../statics/spiritmender-context/spiritmender-context-statics';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { questFindQuestPathBroker } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questSpliceFixerBroker } from '../../../brokers/quest/splice-fixer/quest-splice-fixer-broker';

const SPIRITMENDER_BATCHES_DIR = 'spiritmender-batches';
const LAWBRINGER_VERIFICATION_COMMAND = 'npm run ward';

export const RecoverLawbringerLayerResponder = async ({
  questId,
  failedItem,
}: {
  questId: QuestId;
  failedItem: WorkItem;
}): Promise<AdapterResult> => {
  // No structured ward-detail on a lawbringer failure — the failure summary is the only signal.
  const summaryText = failedItem.summary ?? failedItem.errorMessage ?? '';
  const contextInstructions = `${summaryText}\n\n${spiritmenderContextStatics.lawbringerFailure.instructions}`;

  const batch = spiritmenderBatchContract.parse({ filePaths: [], errors: [] });

  const spiritmenderId = crypto.randomUUID();
  const spiritmenderItem = workItemContract.parse({
    id: spiritmenderId,
    role: 'spiritmender',
    status: 'pending',
    spawnerType: 'agent',
    dependsOn: [failedItem.id],
    maxAttempts: 1,
    createdAt: new Date().toISOString(),
    insertedBy: failedItem.id,
  });

  const retryItem = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'lawbringer',
    status: 'pending',
    spawnerType: 'agent',
    dependsOn: [spiritmenderId],
    attempt: failedItem.attempt + 1,
    maxAttempts: failedItem.maxAttempts,
    createdAt: new Date().toISOString(),
    insertedBy: failedItem.id,
    ...(failedItem.wardMode ? { wardMode: failedItem.wardMode } : {}),
  });

  // Sidecar PATH (PINNED): <questDir>/spiritmender-batches/<spiritmenderId>.json — resolved
  // the same way the ward broker resolves the quest dir (questFindQuestPathBroker + pathJoin).
  const { questPath } = await questFindQuestPathBroker({ questId });
  const batchesDir = pathJoinAdapter({ paths: [questPath, SPIRITMENDER_BATCHES_DIR] });
  await fsMkdirAdapter({ filepath: batchesDir });

  const batchFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [batchesDir, `${spiritmenderId}.json`] }),
  );
  const batchContent = JSON.stringify({
    filePaths: batch.filePaths,
    errors: batch.errors,
    verificationCommand: LAWBRINGER_VERIFICATION_COMMAND,
    contextInstructions: errorMessageContract.parse(contextInstructions),
  });
  await fsWriteFileAdapter({
    filePath: batchFilePath,
    contents: fileContentsContract.parse(batchContent),
  });

  // Re-fetch post-modify so the splice rewires downstream (blightwarden) against the
  // freshly-failed lawbringer and the idempotency guard sees the current work-item set.
  const getResult = await questGetBroker({
    input: getQuestInputContract.parse({ questId }),
  });
  if (!getResult.success || getResult.quest === undefined) {
    return adapterResultContract.parse({ success: true });
  }

  return questSpliceFixerBroker({
    questId,
    quest: getResult.quest,
    failedWorkItemId: failedItem.id,
    fixerItems: [spiritmenderItem],
    retryItem,
  });
};
