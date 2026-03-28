/**
 * PURPOSE: Executes siegemaster phase — runs integration/e2e tests, skips pending on failure and spawns pathseeker replan
 *
 * USAGE:
 * await runSiegemasterLayerBroker({questId, workItem, startPath});
 * // Runs siegemaster agent. On failure: skips pending work items, creates pathseeker replan
 */

import {
  errorMessageContract,
  type FilePath,
  type QuestId,
  type SessionId,
  type WorkItem,
  workItemContract,
} from '@dungeonmaster/shared/contracts';

import type { OnAgentEntryCallback } from '../../../contracts/orchestration-callbacks/orchestration-callbacks-contract';
import { slotIndexContract } from '../../../contracts/slot-index/slot-index-contract';

import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import { workUnitContract } from '../../../contracts/work-unit/work-unit-contract';
import { agentSpawnByRoleBroker } from '../../agent/spawn-by-role/agent-spawn-by-role-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

const FAILURE_MARKER = 'FAILED OBSERVABLES:';

export const runSiegemasterLayerBroker = async ({
  questId,
  workItem,
  startPath,
  onAgentEntry,
  abortSignal,
}: {
  questId: QuestId;
  workItem: WorkItem;
  startPath: FilePath;
  onAgentEntry: OnAgentEntryCallback;
  abortSignal: AbortSignal;
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
    relatedObservables: allObservables,
  });

  const slotIndex = slotIndexContract.parse(0);
  let trackedSessionId: SessionId | null = null;

  const spawnResult = await agentSpawnByRoleBroker({
    workUnit,
    startPath,
    abortSignal,
    onLine: ({ line }: { line: string }) => {
      onAgentEntry({
        slotIndex,
        entry: { raw: line },
        ...(trackedSessionId === null ? {} : { sessionId: trackedSessionId }),
      });
    },
    onSessionId: ({ sessionId }) => {
      trackedSessionId = sessionId;
      questModifyBroker({
        input: {
          questId,
          workItems: [{ id: workItem.id, sessionId }],
        } as ModifyQuestInput,
      }).catch((error: unknown) => {
        process.stderr.write(`[siegemaster] session-id update failed: ${String(error)}\n`);
      });
    },
  });

  // If aborted (paused), bail out without creating follow-up items
  if (abortSignal.aborted) {
    return;
  }

  const summary = spawnResult.signal?.summary ?? '';
  const hasFailed = summary.includes(FAILURE_MARKER);
  const isComplete = spawnResult.signal?.signal === 'complete' && !hasFailed;

  const sessionId = spawnResult.sessionId ?? undefined;

  if (isComplete) {
    await questModifyBroker({
      input: {
        questId,
        workItems: [
          {
            id: workItem.id,
            status: 'complete',
            completedAt: new Date().toISOString(),
            ...(sessionId === undefined ? {} : { sessionId }),
          },
        ],
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
    dependsOn: [workItem.id],
    maxAttempts: 3,
    createdAt: new Date().toISOString(),
    insertedBy: workItem.id,
  });

  await questModifyBroker({
    input: {
      questId,
      workItems: [
        {
          id: workItem.id,
          status: 'failed',
          completedAt,
          errorMessage,
          ...(sessionId === undefined ? {} : { sessionId }),
        },
        ...skippedItems,
        pathseekerReplan,
      ],
    } as ModifyQuestInput,
  });
};
