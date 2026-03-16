/**
 * PURPOSE: Executes siegemaster phase — single agent writing integration/e2e tests, creates codeweaver fix on failure
 *
 * USAGE:
 * await runSiegemasterLayerBroker({questId, workItem, startPath});
 * // Runs siegemaster agent. If summary contains FAILED OBSERVABLES, creates codeweaver-fix + ward-rerun + siege-recheck chain
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
import { questWorkItemInsertBroker } from '../work-item-insert/quest-work-item-insert-broker';

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

  // Siegemaster reported failures or crashed — mark as failed with the summary as error message
  const completedAt = new Date().toISOString();
  const errorMessage = hasFailed
    ? errorMessageContract.parse(summary)
    : errorMessageContract.parse('siege_check_failed');

  await questModifyBroker({
    input: {
      questId,
      workItems: [{ id: workItem.id, status: 'failed', completedAt, errorMessage }],
    } as ModifyQuestInput,
  });

  // Create fix chain: codeweaver-fix → ward-rerun → siege-recheck
  // The codeweaver gets the failure summary as its error context
  const cwFixItem = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'codeweaver',
    status: 'pending',
    spawnerType: 'agent',
    dependsOn: [],
    maxAttempts: 1,
    timeoutMs: slotManagerStatics.codeweaver.timeoutMs,
    createdAt: new Date().toISOString(),
    insertedBy: workItem.id,
    errorMessage,
  });

  const wardRerun = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'ward',
    status: 'pending',
    spawnerType: 'command',
    dependsOn: [cwFixItem.id],
    maxAttempts: slotManagerStatics.ward.maxRetries,
    createdAt: new Date().toISOString(),
    insertedBy: workItem.id,
  });

  const siegeRecheck = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'siegemaster',
    status: 'pending',
    spawnerType: 'agent',
    dependsOn: [wardRerun.id],
    timeoutMs: slotManagerStatics.siegemaster.timeoutMs,
    maxAttempts: 1,
    createdAt: new Date().toISOString(),
    insertedBy: workItem.id,
  });

  const replacementMapping = [{ oldId: workItem.id, newId: siegeRecheck.id }];

  const freshResult = await questGetBroker({ input: questInput });
  if (freshResult.success && freshResult.quest) {
    await questWorkItemInsertBroker({
      questId,
      quest: freshResult.quest,
      newWorkItems: [cwFixItem, wardRerun, siegeRecheck],
      replacementMapping,
    });
  }
};
