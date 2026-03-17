/**
 * PURPOSE: Executes siegemaster phase — runs integration/e2e tests, skips pending on failure and spawns pathseeker replan
 *
 * USAGE:
 * await runSiegemasterLayerBroker({questId, workItem, startPath});
 * // Runs siegemaster agent. On failure: skips pending work items, creates pathseeker replan
 */

import {
  errorMessageContract,
  workItemContract,
  type FilePath,
  type QuestId,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';

import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { workUnitContract } from '../../../contracts/work-unit/work-unit-contract';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { agentSpawnByRoleBroker } from '../../agent/spawn-by-role/agent-spawn-by-role-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

const FAILURE_MARKER = 'FAILED OBSERVABLES:';

export const runSiegemasterLayerBroker = async ({
  questId,
  workItem,
  startPath,
}: {
  questId: QuestId;
  workItem: WorkItem;
  startPath: FilePath;
}): Promise<void> => {
  const questInput = getQuestInputContract.parse({ questId });
  const questResult = await questGetBroker({ input: questInput });
  if (!questResult.success || !questResult.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }
  const { quest } = questResult;

  const allObservables = quest.flows.flatMap((f) => f.nodes).flatMap((n) => n.observables);

  const workUnit = workUnitContract.parse({
    role: 'siegemaster',
    questId,
    observables: allObservables,
  });

  const timeoutMs = timeoutMsContract.parse(
    workItem.timeoutMs ?? slotManagerStatics.siegemaster.timeoutMs,
  );

  const spawnResult = await agentSpawnByRoleBroker({
    workUnit,
    timeoutMs,
    startPath,
  });

  const summary = spawnResult.signal?.summary ?? '';
  const hasFailed = summary.includes(FAILURE_MARKER);
  const isComplete = spawnResult.signal?.signal === 'complete' && !hasFailed;

  if (isComplete) {
    await questModifyBroker({
      input: {
        questId,
        workItems: [{ id: workItem.id, status: 'complete', completedAt: new Date().toISOString() }],
      } as ModifyQuestInput,
    });
    return;
  }

  // Siegemaster reported failures or crashed — mark as failed, skip pending, spawn pathseeker replan
  const completedAt = new Date().toISOString();
  const errorMessage = hasFailed
    ? errorMessageContract.parse(summary)
    : errorMessageContract.parse('siege_check_failed');

  const pendingItems = quest.workItems.filter(
    (wi) => wi.status === 'pending' && wi.id !== workItem.id,
  );

  const skippedItems = pendingItems.map((wi) => ({
    id: wi.id,
    status: 'skipped' as const,
    completedAt,
  }));

  const pathseekerReplan = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'pathseeker',
    status: 'pending',
    spawnerType: 'agent',
    dependsOn: [],
    maxAttempts: 3,
    timeoutMs: slotManagerStatics.pathseeker.timeoutMs,
    createdAt: new Date().toISOString(),
    insertedBy: workItem.id,
  });

  await questModifyBroker({
    input: {
      questId,
      workItems: [
        { id: workItem.id, status: 'failed', completedAt, errorMessage },
        ...skippedItems,
        pathseekerReplan,
      ],
    } as ModifyQuestInput,
  });
};
