/**
 * PURPOSE: Executes siegemaster phase — single agent checking ALL observables, creates fix chain on failure
 *
 * USAGE:
 * await runSiegemasterLayerBroker({questId, workItem, startPath});
 * // Runs siegemaster agent, on failure creates tack-on steps + codeweaver-fix + ward-rerun + siege-recheck chain
 */

import {
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

  // Build work unit with ALL observables (full re-check)
  const allObservables = quest.flows.flatMap((f) => f.nodes).flatMap((n) => n.observables);

  const workUnit = workUnitContract.parse({
    role: 'siegemaster',
    questId,
    observables: allObservables,
  });

  const timeoutMs = timeoutMsContract.parse(
    workItem.timeoutMs ?? slotManagerStatics.siegemaster.timeoutMs,
  );

  // Run single siegemaster agent
  const spawnResult = await agentSpawnByRoleBroker({
    workUnit,
    timeoutMs,
    startPath,
  });

  // Check if signal indicates complete
  const isComplete = spawnResult.signal?.signal === 'complete' || spawnResult.exitCode === 0;

  if (isComplete) {
    await questModifyBroker({
      input: {
        questId,
        workItems: [{ id: workItem.id, status: 'complete', completedAt: new Date().toISOString() }],
      } as ModifyQuestInput,
    });
    return;
  }

  // Siegemaster failed — mark current as failed
  const completedAt = new Date().toISOString();
  await questModifyBroker({
    input: {
      questId,
      workItems: [
        { id: workItem.id, status: 'failed', completedAt, errorMessage: 'siege_check_failed' },
      ],
    } as ModifyQuestInput,
  });

  // Create fix chain: codeweaver-fix -> ward-rerun -> siege-recheck
  // Create a single codeweaver fix item (no specific step — reads from quest context)
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

  // Update downstream (lawbringer) to depend on new siege instead of failed one
  const replacementMapping = [{ oldId: workItem.id, newId: siegeRecheck.id }];

  // Load fresh quest for insert
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
