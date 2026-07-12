/**
 * PURPOSE: Recovers ANY code-recovery role that signalled `failed` (a code failure it could not build
 *   or verify) — splices a spiritmender (fed the agent's finding via a sidecar) + a ward(changed) gate
 *   + a fresh re-run of the SAME role, rewiring downstream dependents onto the fresh run. The
 *   spiritmender fixes the code; ward proves the build is green; the fresh agent continues its work.
 *
 *   Recovery-first: this NEVER blocks the quest. When the role's retry budget is exhausted
 *   (`attempt >= maxAttempts - 1`) the repeated code failure is re-interpreted as a plan hole and
 *   escalates to a PathSeeker replan (questSplicePathseekerReplanBroker) — which itself only blocks
 *   once the whole replan loop is spent. Generalizes the Siegemaster recover shape to every
 *   code-recovery role (siege keeps its manual-QA spiritmender context; other roles get a generic
 *   code-failure context).
 *
 * USAGE:
 * const { recovered, replanned, blocked } = await questRecoverRoleBroker({
 *   questId, failedWorkItemId, finding,
 * });
 * // Budget remaining -> recovered:true (spiritmender + ward + fresh role spliced). Budget spent ->
 * //   recovered:false, and replanned/blocked reflect the PathSeeker-replan escalation. Idempotent.
 *
 * WHEN-TO-USE: From the signal-back handler when a code-recovery role signals `failed`.
 * WHEN-NOT-TO-USE: For `failed-replan` (route straight to questSplicePathseekerReplanBroker), for ward
 *   (questRunWardBroker owns ward recovery), or for the planner / minions / spiritmender.
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
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questSpliceFixerBroker } from '../splice-fixer/quest-splice-fixer-broker';
import { questSplicePathseekerReplanBroker } from '../splice-pathseeker-replan/quest-splice-pathseeker-replan-broker';

const SPIRITMENDER_BATCHES_DIR = 'spiritmender-batches';

// The spiritmender investigates and discovers the affected files from the finding, then ward-verifies
// what it touched — the placeholder mirrors the roleFailure context's own guidance.
const RECOVERY_VERIFICATION_COMMAND = 'npm run ward -- -- <the files you fixed>';

const NO_FINDING_FALLBACK =
  'The agent reported a code failure without a finding summary — investigate the failure, reproduce it, fix the root cause, and ward-verify the files you touched.';

export const questRecoverRoleBroker = async ({
  questId,
  failedWorkItemId,
  finding,
}: {
  questId: QuestId;
  failedWorkItemId: QuestWorkItemId;
  finding?: WorkItem['summary'];
}): Promise<{ recovered: boolean; replanned: boolean; blocked: boolean }> => {
  const getResult = await questGetBroker({ input: getQuestInputContract.parse({ questId }) });
  if (!getResult.success || getResult.quest === undefined) {
    return { recovered: false, replanned: false, blocked: false };
  }
  const { quest } = getResult;

  // Idempotency: a double signal-back can't double-splice. If this item already inserted a recovery
  // (or a replan), the recovery has already happened.
  if (quest.workItems.some((workItem) => workItem.insertedBy === failedWorkItemId)) {
    return { recovered: true, replanned: false, blocked: false };
  }

  const failedItem = quest.workItems.find((workItem) => workItem.id === failedWorkItemId);
  if (failedItem === undefined) {
    return { recovered: false, replanned: false, blocked: false };
  }

  // Budget exhausted — escalate to a PathSeeker replan (the repeated code failure is a plan hole).
  // This never blocks directly; questSplicePathseekerReplanBroker blocks only when the replan loop
  // itself is spent.
  if (failedItem.attempt >= failedItem.maxAttempts - 1) {
    const { replanned, blocked } = await questSplicePathseekerReplanBroker({
      questId,
      failedWorkItemId,
      brief: finding,
      actualSignal: 'failed',
    });
    return { recovered: false, replanned, blocked };
  }

  const createdAt = new Date().toISOString();

  // 1. Spiritmender — fixes the code and corrects any false-positive test (red-first).
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
  //    The failed role has no modify-quest access for its finding, so it rides signal-back's summary
  //    into here. Siege keeps its manual-QA context; every other role gets the generic code-failure
  //    context.
  const { questPath } = await questFindQuestPathBroker({ questId });
  const batchesDir = pathJoinAdapter({ paths: [questPath, SPIRITMENDER_BATCHES_DIR] });
  await fsMkdirAdapter({ filepath: batchesDir });
  const batchFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [batchesDir, `${String(spiritmenderItem.id)}.json`] }),
  );
  const findingText =
    finding !== undefined && String(finding).length > 0 ? String(finding) : NO_FINDING_FALLBACK;
  const contextInstructions =
    failedItem.role === 'siegemaster'
      ? spiritmenderContextStatics.siegemasterFailure.instructions
      : spiritmenderContextStatics.roleFailure.instructions;
  const batchContents = JSON.stringify({
    filePaths: [],
    errors: [errorMessageContract.parse(findingText)],
    verificationCommand: RECOVERY_VERIFICATION_COMMAND,
    contextInstructions,
  });
  await fsWriteFileAdapter({
    filePath: batchFilePath,
    contents: fileContentsContract.parse(batchContents),
  });

  // 3. Ward(changed) gate — the spiritmender just edited code, so prove the build is green before the
  //    role re-runs. Its own retry budget catches any residual breakage.
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

  // 4. Fresh re-run of the same role — continues the work on a now-green build, attempt + 1.
  const freshItem = workItemContract.parse({
    id: crypto.randomUUID(),
    role: failedItem.role,
    status: 'pending',
    spawnerType: 'agent',
    relatedDataItems: failedItem.relatedDataItems,
    dependsOn: [wardItem.id],
    attempt: failedItem.attempt + 1,
    maxAttempts: failedItem.maxAttempts,
    createdAt,
    insertedBy: failedWorkItemId,
  });

  await questSpliceFixerBroker({
    questId,
    quest,
    failedWorkItemId,
    fixerItems: [spiritmenderItem, wardItem],
    retryItem: freshItem,
  });

  return { recovered: true, replanned: false, blocked: false };
};
