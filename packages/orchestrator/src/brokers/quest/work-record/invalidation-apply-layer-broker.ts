/**
 * PURPOSE: Layer of `questWorkRecordBroker` — applies `quest-work`'s `invalidation` payload: a
 * `flowId` and a reason that re-opens the flow by appending a `walk-reset` note to
 * `quest.planningNotes.questNotes`. No field on the flow is touched — a unit's mark is already the
 * one on the most recent work item assigned it, so the note is the whole durable record. Carries
 * five guards, prefixed `quest-work:` — including the `'no flows at all'` branch when `flowIds` is
 * empty. The siegemaster-only authority check is keyed on the linked operation item's FAMILY
 * (`workItemFamilyResolveTransformer`), never on `operationItem.role` read as a bare string, because
 * a siege FIXER's own work item is mid-family (`step: 'fixHappy'` / `'fixAdversarial'`).
 *
 * USAGE:
 * await invalidationApplyLayerBroker({ quest, workItem, workItemId, questId, questFilePath, flowId, reason, nowAt });
 * // Returns { kind: 'invalidation', flowId, noteId, clearedCount } once persisted
 */

import {
  fileContentsContract,
  questContract,
  questNoteContract,
} from '@dungeonmaster/shared/contracts';
import type {
  FilePath,
  FlowId,
  Quest,
  QuestId,
  QuestNote,
  QuestWorkItemId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';

import type { IsoTimestamp } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import { questWorkRecordResultContract } from '../../../contracts/quest-work-record-result/quest-work-record-result-contract';
import type { QuestWorkRecordResult } from '../../../contracts/quest-work-record-result/quest-work-record-result-contract';
import { workItemFamilyResolveTransformer } from '../../../transformers/work-item-family-resolve/work-item-family-resolve-transformer';
import { workItemLinkedOperationResolveTransformer } from '../../../transformers/work-item-linked-operation-resolve/work-item-linked-operation-resolve-transformer';
import { questPersistBroker } from '../persist/quest-persist-broker';

const JSON_INDENT_SPACES = 2;

export const invalidationApplyLayerBroker = async ({
  quest,
  workItem,
  workItemId,
  questId,
  questFilePath,
  flowId,
  reason,
  nowAt,
}: {
  quest: Quest;
  workItem: WorkItem;
  workItemId: QuestWorkItemId;
  questId: QuestId;
  questFilePath: FilePath;
  flowId: FlowId;
  reason: QuestNote['detail'];
  nowAt: IsoTimestamp;
}): Promise<QuestWorkRecordResult> => {
  const operationItem = workItemLinkedOperationResolveTransformer({ quest, workItem });

  if (operationItem === undefined) {
    throw new Error(
      `quest-work: work item ${workItemId} has no linked operation item on quest ${questId}, so it declares no flow scope — nothing was reset`,
    );
  }

  const family = workItemFamilyResolveTransformer({ quest, operationItem });

  if (family !== 'siegemaster') {
    throw new Error(
      `quest-work: only a siegemaster work item may reset a walk — work item ${workItemId} is linked to a ${operationItem.role} operation item (${String(operationItem.id)})`,
    );
  }

  const inScope = operationItem.flowIds.some((scoped) => scoped === flowId);
  if (!inScope) {
    const scope =
      operationItem.flowIds.length === 0
        ? 'no flows at all'
        : operationItem.flowIds.map((scoped) => String(scoped)).join(', ');
    throw new Error(
      `quest-work: flow ${flowId} is outside the scope of work item ${workItemId}, whose operation item ${String(operationItem.id)} covers ${scope} — nothing was reset`,
    );
  }

  const targetFlow = quest.flows.find((flow) => flow.id === flowId);
  if (targetFlow === undefined) {
    throw new Error(`quest-work: flow ${flowId} is not on quest ${questId} — nothing was reset`);
  }

  const clearedCount = 0;

  const priorResets = quest.planningNotes.questNotes.filter(
    (note) => note.kind === 'walk-reset' && note.flowId === flowId,
  ).length;

  const note = questNoteContract.parse({
    id: `walk-reset-${String(flowId)}-${String(priorResets + 1)}`,
    kind: 'walk-reset',
    role: 'siegemaster',
    workItemId,
    flowId,
    summary: `Siegemaster walk reset for flow ${String(flowId)} — ${String(clearedCount)} sign-off(s) cleared`,
    detail: reason,
    at: nowAt,
  });

  const updatedQuest = questContract.parse({
    ...quest,
    planningNotes: {
      ...quest.planningNotes,
      questNotes: [...quest.planningNotes.questNotes, note],
    },
    updatedAt: nowAt,
  });

  const questJson = fileContentsContract.parse(
    JSON.stringify(updatedQuest, null, JSON_INDENT_SPACES),
  );

  await questPersistBroker({ questFilePath, contents: questJson, questId });

  return questWorkRecordResultContract.parse({
    kind: 'invalidation',
    flowId,
    noteId: note.id,
    clearedCount,
  });
};
