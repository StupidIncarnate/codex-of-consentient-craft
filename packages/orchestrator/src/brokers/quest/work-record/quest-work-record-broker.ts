/**
 * PURPOSE: Applies one of `quest-work`'s four record-bearing payloads — `observations`, `outcome`,
 * `invalidation`, `request` — to `quest.json`, under the quest's own modify lock. `plan` and
 * `amendment` never reach here: they write a separate file, through `questWorkPlanWriteBroker`.
 *
 * USAGE:
 * await questWorkRecordBroker({ questId, workItemId, payload: { kind: 'outcome', word: 'done', reason: '…' } });
 * // Returns { kind: 'outcome', word: 'done' } once persisted
 *
 * Bypasses `questModifyBroker`/`questOperationsUpdateBroker` on purpose — both take
 * `questWithModifyLockBroker` themselves and it is deliberately non-reentrant, so wrapping either
 * deadlocks the questId. This broker takes the lock itself and persists through the layers below,
 * the same shape `questResetFlowSignoffsBroker` already uses for exactly this reason.
 *
 * Every refusal THROWS — none returns `{ success: false }`. Nothing is persisted on a refusal, so
 * the session fixes what the message names and calls again.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract, unitObservationContract } from '@dungeonmaster/shared/contracts';
import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import type { QuestWorkInput } from '../../../contracts/quest-work-input/quest-work-input-contract';
import { questWorkRecordResultContract } from '../../../contracts/quest-work-record-result/quest-work-record-result-contract';
import type { QuestWorkRecordResult } from '../../../contracts/quest-work-record-result/quest-work-record-result-contract';
import { isStepMintableOnRequestGuard } from '../../../guards/is-step-mintable-on-request/is-step-mintable-on-request-guard';
import { questWorkOutcomeDeriveTransformer } from '../../../transformers/quest-work-outcome-derive/quest-work-outcome-derive-transformer';
import { workItemFamilyResolveTransformer } from '../../../transformers/work-item-family-resolve/work-item-family-resolve-transformer';
import { workItemLinkedOperationResolveTransformer } from '../../../transformers/work-item-linked-operation-resolve/work-item-linked-operation-resolve-transformer';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';
import { questWithModifyLockBroker } from '../with-modify-lock/quest-with-modify-lock-broker';
import { invalidationApplyLayerBroker } from './invalidation-apply-layer-broker';
import { workItemPatchLayerBroker } from './work-item-patch-layer-broker';

type RecordPayload = Exclude<QuestWorkInput['payload'], { kind: 'plan' } | { kind: 'amendment' }>;

export const questWorkRecordBroker = async ({
  questId,
  workItemId,
  payload,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  payload: RecordPayload;
}): Promise<QuestWorkRecordResult> =>
  questWithModifyLockBroker({
    questId,
    run: async (): Promise<QuestWorkRecordResult> => {
      const { questPath } = await questFindQuestPathBroker({ questId });
      const questFilePath = filePathContract.parse(
        pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
      );
      const quest = await questLoadBroker({ questFilePath });

      const workItem = quest.workItems.find((item) => item.id === workItemId);
      if (workItem === undefined) {
        // `invalidation` carries this guard message VERBATIM from `questResetFlowSignoffsBroker`
        // (`:72`, `reset-flow-signoffs:` swapped for `quest-work:`) — the other three kinds are new
        // vocabulary this tool owns outright, so they read "recorded" rather than "reset".
        throw new Error(
          payload.kind === 'invalidation'
            ? `quest-work: work item ${workItemId} is not on quest ${questId} — nothing was reset`
            : `quest-work: work item ${workItemId} is not on quest ${questId} — nothing was recorded`,
        );
      }

      const nowAt = isoTimestampContract.parse(new Date().toISOString());

      if (payload.kind === 'observations') {
        const stamped = payload.observations.map((observation) =>
          unitObservationContract.parse({ ...observation, at: nowAt }),
        );

        await workItemPatchLayerBroker({
          quest,
          questFilePath,
          questId,
          workItemId,
          patch: { observations: stamped },
          nowAt,
        });

        return questWorkRecordResultContract.parse({
          kind: 'observations',
          count: stamped.length,
        });
      }

      if (payload.kind === 'outcome') {
        const derived = questWorkOutcomeDeriveTransformer({ workItem, word: payload.word });

        await workItemPatchLayerBroker({
          quest,
          questFilePath,
          questId,
          workItemId,
          patch: { declaredWord: derived, declaredReason: payload.reason },
          nowAt,
        });

        return questWorkRecordResultContract.parse({ kind: 'outcome', word: derived });
      }

      if (payload.kind === 'invalidation') {
        return invalidationApplyLayerBroker({
          quest,
          workItem,
          workItemId,
          questId,
          questFilePath,
          flowId: payload.flowId,
          reason: payload.reason,
          nowAt,
        });
      }

      // payload.kind === 'request'
      const operationItem = workItemLinkedOperationResolveTransformer({ quest, workItem });

      if (operationItem === undefined) {
        throw new Error(
          `quest-work: work item ${workItemId} has no linked operation item on quest ${questId}, so it names no family to check the requested step against — nothing was recorded`,
        );
      }

      const family = workItemFamilyResolveTransformer({ quest, operationItem });

      if (
        !isStepMintableOnRequestGuard({
          ...(family !== undefined && { family }),
          step: payload.step,
        })
      ) {
        throw new Error(
          `quest-work: step '${payload.step}' is not mintableOnRequest in family '${
            family === undefined ? '(none)' : String(family)
          }' — a session cannot conjure an arbitrary step. Nothing was recorded.`,
        );
      }

      await workItemPatchLayerBroker({
        quest,
        questFilePath,
        questId,
        workItemId,
        patch: { requestedStep: payload.step, requestedReason: payload.reason },
        nowAt,
      });

      return questWorkRecordResultContract.parse({ kind: 'request', step: payload.step });
    },
  });
