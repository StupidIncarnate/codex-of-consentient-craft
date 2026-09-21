/**
 * PURPOSE: Validates a submitted plan (the `quest-work` `plan` OR `amendment` payload, identically —
 * an amendment runs the same nineteen checks against the same whole-file shape, never a patch) and
 * writes it to `<questFolder>/planned-work/<operationItemId>.json` through story 09's write broker.
 * A plan that fails even one check is refused WHOLE: nothing is written, and the thrown message
 * names every failing piece and which check it failed, because the planner has to act on it inside
 * the same turn.
 *
 * USAGE:
 * await questWorkPlanWriteBroker({ questId, workItemId, plan });
 * // Returns { operationItemId } once the plan has passed all nineteen checks and is on disk
 *
 * Takes `questWithModifyLockBroker` even though the write itself lands outside `quest.json`: the
 * validation reads `quest.workItems`/`quest.operations` live, and queuing behind the same lock every
 * other `quest-work` payload uses is what keeps that read from racing a concurrent mutation.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { OperationItemId, QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import type { QuestWorkInput } from '../../../contracts/quest-work-input/quest-work-input-contract';
import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import { workPlanContract } from '../../../contracts/work-plan/work-plan-contract';
import { workPlanValidateTransformer } from '../../../transformers/work-plan-validate/work-plan-validate-transformer';
import { plannedWorkWriteBroker } from '../../planned-work/write/planned-work-write-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';
import { questWithModifyLockBroker } from '../with-modify-lock/quest-with-modify-lock-broker';

type PlanEnvelope = Extract<QuestWorkInput['payload'], { kind: 'plan' }>['plan'];

export const questWorkPlanWriteBroker = async ({
  questId,
  workItemId,
  plan,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  plan: PlanEnvelope;
}): Promise<{ operationItemId: OperationItemId }> =>
  questWithModifyLockBroker({
    questId,
    run: async (): Promise<{ operationItemId: OperationItemId }> => {
      const { questPath } = await questFindQuestPathBroker({ questId });
      const questFilePath = filePathContract.parse(
        pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
      );
      const quest = await questLoadBroker({ questFilePath });

      const workItem = quest.workItems.find((item) => item.id === workItemId);
      if (workItem === undefined) {
        throw new Error(
          `quest-work: work item ${workItemId} is not on quest ${questId} — nothing was written`,
        );
      }

      const stamped = {
        ...plan,
        writtenBy: workItemId,
        writtenAt: isoTimestampContract.parse(new Date().toISOString()),
      };

      const failures = workPlanValidateTransformer({ quest, workItem, plan: stamped });

      if (failures.length > 0) {
        const totalPieces = stamped.batches.flatMap((batch) => batch.pieces).length;
        const failedPieceIds = new Set(failures.map((failure) => String(failure.pieceId)));

        throw new Error(
          [
            `quest-work: plan refused — ${String(failedPieceIds.size)} of ${String(totalPieces)} pieces failed validation. Nothing was written.`,
            '',
            ...failures.map((failure) => `  ${String(failure.pieceId)}   ${failure.message}`),
            '',
            'Fix each and resubmit the whole plan in this turn.',
          ].join('\n'),
        );
      }

      const validatedPlan = workPlanContract.parse(stamped);

      await plannedWorkWriteBroker({
        questFolderPath: questPath,
        operationItemId: validatedPlan.operationItemId,
        plan: validatedPlan,
      });

      return { operationItemId: validatedPlan.operationItemId };
    },
  });
