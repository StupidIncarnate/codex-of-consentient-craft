/**
 * PURPOSE: Executes blightwarden phase — cross-cutting whole-diff audit, drains+skips pending + spawns pathseeker replan on failed-replan
 *
 * USAGE:
 * await runBlightwardenLayerBroker({questId, workItem, startPath, onAgentEntry, abortSignal});
 * // Spawns Blightwarden agent with scopeSize + designDecisions + questId.
 * // Signal handling:
 * //   complete      → mark item complete, return
 * //   failed        → mark item failed (orchestration loop may block; routing via FAILURE_ROLE_MAP is handle-signal territory)
 * //   failed-replan → drain+skip pending items, spawn PathSeeker replan (mirrors siegemaster pattern)
 * // No dev server lifecycle — Blightwarden is a static diff auditor.
 */

import {
  errorMessageContract,
  getQuestInputContract,
  type FilePath,
  type ModifyQuestInput,
  type QuestId,
  type SessionId,
  type WorkItem,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import { isPendingWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import type { OnAgentEntryCallback } from '../../../contracts/orchestration-callbacks/orchestration-callbacks-contract';
import { slotIndexContract } from '../../../contracts/slot-index/slot-index-contract';
import { workUnitContract } from '../../../contracts/work-unit/work-unit-contract';
import { agentSpawnByRoleBroker } from '../../agent/spawn-by-role/agent-spawn-by-role-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const runBlightwardenLayerBroker = async ({
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

  const scopeSize = quest.planningNotes.scopeClassification?.size;

  const workUnit = workUnitContract.parse({
    role: 'blightwarden',
    questId,
    relatedDesignDecisions: quest.designDecisions,
    ...(scopeSize === undefined ? {} : { scopeSize }),
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
        process.stderr.write(`[blightwarden] session-id update failed: ${String(error)}\n`);
      });
    },
  });

  // If aborted (paused), bail out without mutating quest state
  if (abortSignal.aborted) {
    return;
  }

  const agentSummary = spawnResult.signal?.summary ?? undefined;
  const signal = spawnResult.signal?.signal;
  const sessionId = spawnResult.sessionId ?? undefined;

  if (signal === 'complete') {
    await questModifyBroker({
      input: {
        questId,
        workItems: [
          {
            id: workItem.id,
            status: 'complete',
            completedAt: new Date().toISOString(),
            ...(sessionId === undefined ? {} : { sessionId }),
            ...(agentSummary === undefined ? {} : { summary: agentSummary }),
          },
        ],
      } as ModifyQuestInput,
    });
    return;
  }

  if (signal === 'failed-replan') {
    // Drain + skip all pending items, then insert a PathSeeker replan depending on this item.
    // Mirrors run-siegemaster-layer-broker's failure path verbatim.
    const completedAt = new Date().toISOString();
    const summaryText = agentSummary ?? '';
    const errorMessage =
      summaryText.length > 0
        ? errorMessageContract.parse(summaryText)
        : errorMessageContract.parse('blightwarden_replan_requested');

    const freshQuestInput = getQuestInputContract.parse({ questId });
    const freshQuestResult = await questGetBroker({ input: freshQuestInput });
    const freshWorkItems =
      freshQuestResult.success && freshQuestResult.quest
        ? freshQuestResult.quest.workItems
        : quest.workItems;

    const pendingItems = freshWorkItems.filter(
      (wi) => isPendingWorkItemStatusGuard({ status: wi.status }) && wi.id !== workItem.id,
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
            ...(agentSummary === undefined ? {} : { summary: agentSummary }),
          },
          ...skippedItems,
          pathseekerReplan,
        ],
      } as ModifyQuestInput,
    });
    return;
  }

  // signal === 'failed' OR no signal at all (crash / timeout) — mark failed only.
  // The orchestration loop decides next action (handle-signal-layer-broker routes
  // blightwarden failures to pathseeker via FAILURE_ROLE_MAP; Group 9 wires dispatch).
  const completedAt = new Date().toISOString();
  const summaryText = agentSummary ?? '';
  const errorMessage =
    summaryText.length > 0
      ? errorMessageContract.parse(summaryText)
      : errorMessageContract.parse('blightwarden_failed');

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
          ...(agentSummary === undefined ? {} : { summary: agentSummary }),
        },
      ],
    } as ModifyQuestInput,
  });
};
