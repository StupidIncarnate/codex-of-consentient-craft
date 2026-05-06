/**
 * PURPOSE: Executes lawbringer work items via slot manager, resolves relatedDataItems to steps for file pairs
 *
 * USAGE:
 * await runLawbringerLayerBroker({questId, workItems, startPath, slotCount, slotOperations});
 * // Resolves steps from relatedDataItems, runs lawbringer agents, maps results back to quest work items
 */

import {
  adapterResultContract,
  type AdapterResult,
  type FilePath,
  type GuildId,
  type QuestId,
  type QuestWorkItemId,
  type StreamSignalKind,
  type WorkItem,
  workItemContract,
} from '@dungeonmaster/shared/contracts';

import { followupDepthContract } from '../../../contracts/followup-depth/followup-depth-contract';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import type { OnAgentEntryCallback } from '../../../contracts/orchestration-callbacks/orchestration-callbacks-contract';
import type { StreamSignal } from '../../../contracts/stream-signal/stream-signal-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import type { WorkItemId } from '../../../contracts/work-item-id/work-item-id-contract';
import { workItemIdContract } from '../../../contracts/work-item-id/work-item-id-contract';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { buildWorkUnitForRoleTransformer } from '../../../transformers/build-work-unit-for-role/build-work-unit-for-role-transformer';
import { resolveRelatedDataItemTransformer } from '../../../transformers/resolve-related-data-item/resolve-related-data-item-transformer';
import { workUnitsToWorkTrackerTransformer } from '../../../transformers/work-units-to-work-tracker/work-units-to-work-tracker-transformer';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';

export const runLawbringerLayerBroker = async ({
  questId,
  workItems,
  startPath,
  guildId,
  slotCount,
  slotOperations,
  onAgentEntry,
  abortSignal,
}: {
  questId: QuestId;
  workItems: WorkItem[];
  startPath: FilePath;
  guildId: GuildId;
  slotCount: SlotCount;
  slotOperations: SlotOperations;
  onAgentEntry: OnAgentEntryCallback;
  abortSignal: AbortSignal;
}): Promise<AdapterResult> => {
  const maxFollowupDepth = followupDepthContract.parse(
    slotManagerStatics.lawbringer.maxFollowupDepth,
  );

  const questInput = getQuestInputContract.parse({ questId });
  const questResult = await questGetBroker({ input: questInput });
  if (!questResult.success || !questResult.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }
  const { quest } = questResult;

  // Resolve relatedDataItems -> steps, build mapping
  const slotToQuestMap = new Map<WorkItemId, QuestWorkItemId>();
  const workUnits = workItems.map((wi, i) => {
    const refs = wi.relatedDataItems;
    if (refs.length === 0) {
      throw new Error(`Work item ${wi.id} has no relatedDataItems`);
    }
    const resolvedSteps = refs.map((ref) => {
      const resolved = resolveRelatedDataItemTransformer({ ref, quest });
      if (resolved.collection !== 'steps') {
        throw new Error(`Expected steps reference, got ${resolved.collection}`);
      }
      return resolved.item;
    });
    const slotId = workItemIdContract.parse(`work-item-${String(i)}`);
    slotToQuestMap.set(slotId, wi.id);
    return buildWorkUnitForRoleTransformer({
      role: 'lawbringer',
      steps: resolvedSteps,
      ...(wi.smoketestPromptOverride === undefined
        ? {}
        : { smoketestPromptOverride: wi.smoketestPromptOverride }),
    });
  });

  const workTracker = workUnitsToWorkTrackerTransformer({ workUnits });

  type SignalSummary = NonNullable<StreamSignal['summary']>;
  const summaryMap = new Map<WorkItemId, SignalSummary>();
  const signalMap = new Map<WorkItemId, StreamSignalKind>();

  const result = await slotManagerOrchestrateBroker({
    questId,
    workTracker,
    slotCount,
    slotOperations,
    startPath,
    guildId,
    maxFollowupDepth,
    abortSignal,
    // Slot manager passes its internal WorkItemId; translate to the quest work item id
    // before invoking the responder-facing onAgentEntry.
    onAgentEntry: ({ slotIndex, entries, workItemId: slotWorkItemId, sessionId }) => {
      const questItemId = slotToQuestMap.get(slotWorkItemId);
      if (questItemId === undefined) return;
      onAgentEntry({
        slotIndex,
        entries,
        questWorkItemId: questItemId,
        ...(sessionId === undefined ? {} : { sessionId }),
      });
    },
    onWorkItemSummary: ({ workItemId, summary }) => {
      summaryMap.set(workItemId, summary as SignalSummary);
    },
    onWorkItemSignal: ({ workItemId, signal }) => {
      signalMap.set(workItemId, signal);
    },
    onFollowupCreated: ({ followupWorkItemId, role, failedWorkItemId }) => {
      const questItemId = slotToQuestMap.get(failedWorkItemId);
      if (questItemId) {
        const newItem = workItemContract.parse({
          id: crypto.randomUUID(),
          role,
          status: 'pending',
          spawnerType: 'agent',
          dependsOn: [questItemId],
          insertedBy: questItemId,
          createdAt: new Date().toISOString(),
        });
        slotToQuestMap.set(followupWorkItemId, newItem.id);
        questModifyBroker({
          input: {
            questId,
            workItems: [newItem],
          } as ModifyQuestInput,
        }).catch((error: unknown) => {
          process.stderr.write(`[lawbringer] quest-modify failed: ${String(error)}\n`);
        });
      }
    },
    onWorkItemSessionId: ({ workItemId, sessionId }) => {
      const questItemId = slotToQuestMap.get(workItemId);
      if (questItemId !== undefined) {
        questModifyBroker({
          input: {
            questId,
            workItems: [{ id: questItemId, sessionId }],
          } as ModifyQuestInput,
        }).catch((error: unknown) => {
          process.stderr.write(`[lawbringer] quest-modify failed: ${String(error)}\n`);
        });
      }
    },
  });

  if (abortSignal.aborted) {
    return adapterResultContract.parse({ success: true });
  }

  // Map results back to quest work items
  const completedAt = new Date().toISOString();
  const failedIds: WorkItemId[] = result.completed ? [] : result.failedIds;
  const failedSlotIds = new Set<WorkItemId>(failedIds);

  const workItemUpdates: {
    id: QuestWorkItemId;
    status: 'complete' | 'failed';
    completedAt?: typeof completedAt;
  }[] = [];

  for (const [slotId, questItemId] of slotToQuestMap) {
    const sessionId = result.sessionIds[slotId];
    const slotSummary = summaryMap.get(slotId);
    const slotSignal = signalMap.get(slotId);
    if (failedSlotIds.has(slotId)) {
      workItemUpdates.push({
        id: questItemId,
        status: 'failed',
        ...(sessionId === undefined ? {} : { sessionId }),
        ...(slotSummary === undefined ? {} : { summary: slotSummary }),
        ...(slotSignal === undefined ? {} : { actualSignal: slotSignal }),
      });
    } else {
      workItemUpdates.push({
        id: questItemId,
        status: 'complete',
        completedAt,
        ...(sessionId === undefined ? {} : { sessionId }),
        ...(slotSummary === undefined ? {} : { summary: slotSummary }),
        ...(slotSignal === undefined ? {} : { actualSignal: slotSignal }),
      });
    }
  }

  await questModifyBroker({
    input: {
      questId,
      workItems: workItemUpdates,
    } as ModifyQuestInput,
  });
  return adapterResultContract.parse({ success: true });
};
