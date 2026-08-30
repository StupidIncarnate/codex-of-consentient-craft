/**
 * PURPOSE: Returns the deterministic QA checklist for a quest's flows — every terminal, branch,
 * observable and off-map probe family, plus which of those units are still outstanding for the
 * calling verification track
 *
 * USAGE:
 * const mine = await questGetQaChecklistBroker({ questId, operationItemId });
 * // Returns the checklists for exactly the scope that operation item is measured over
 *
 * const all = await questGetQaChecklistBroker({ questId });
 * // Returns one QaChecklist per flow on the quest, with no track applied
 *
 * WHEN-TO-USE: a Codeweaver, Flowrider or Siegemaster session — and the reviewer it summons — asks
 * this instead of reading the spec and enumerating by hand.
 *
 * **`operationItemId` IS THE SCOPE, and it is the only correct way to ask.** The item already
 * carries the three things that define the answer — `role` (the track), `flowIds` and
 * `packageNames` — and `operationSignoffScopeTransformer` derives them, which is the SAME
 * derivation every other reader of this coverage uses. Nothing refuses a `done` over this number —
 * it is a work list, not a gate.
 *
 * It replaced three hand-passed arguments, each of which was a way to ask a different question from
 * the one this scope answers: naming a sibling `track` returned the exact complement of the
 * caller's work; omitting `packageNames` did not error but silently WIDENED the measurement to the
 * whole quest; and `flowId` did the same for the item's own flow slice. All three failed by
 * over-reporting, so the remainder never emptied, with nothing anywhere naming the cause.
 *
 * It is also what makes the call reachable from a MINION at all. A minion's `get-agent-prompt`
 * fetch hands it the Quest ID and nothing else, so a scope it must assemble from three values only
 * its parent holds is a scope it cannot assemble; an id its briefing names is one it can.
 *
 * A role with NO sign-off track — `spiritmender`, `warpgate` — resolves to no scope, and the broker
 * says so by returning an empty array. Neither is measured on the flow graph at all, which is why
 * their prompts tell them no checklist tool answers a denominator of theirs.
 *
 * With no `operationItemId` the whole quest is enumerated with no track applied — the read-only
 * shape for a human or a caller that owns no item. An unknown `flowId` yields an empty array rather
 * than throwing: the caller learns the flow is not on this quest, which is a real answer.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type {
  FlowId,
  OperationItemId,
  QaChecklist,
  QuestId,
  SignoffDenominatorTrack,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { operationSignoffScopeTransformer } from '../../../transformers/operation-signoff-scope/operation-signoff-scope-transformer';
import { qaChecklistBuildTransformer } from '../../../transformers/qa-checklist-build/qa-checklist-build-transformer';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

export const questGetQaChecklistBroker = async ({
  questId,
  operationItemId,
  flowId,
}: {
  questId: QuestId;
  operationItemId?: OperationItemId;
  flowId?: FlowId;
}): Promise<{ checklists: QaChecklist[]; track?: SignoffDenominatorTrack }> => {
  const { questPath } = await questFindQuestPathBroker({ questId });

  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );

  const quest = await questLoadBroker({ questFilePath });

  if (operationItemId !== undefined) {
    const operationItem = quest.operations.find((operation) => operation.id === operationItemId);

    if (operationItem === undefined) {
      throw new Error(
        `questGetQaChecklistBroker: operation item ${String(operationItemId)} is not on quest ${String(questId)}`,
      );
    }

    // `null` means this role is measured on something other than the flow graph. An empty array is
    // the honest rendering of that: the caller's discipline names no checklist denominator at all.
    const scope = operationSignoffScopeTransformer({ quest, operationItem });

    if (scope === null) {
      return { checklists: [] };
    }

    return {
      checklists: scope.flows.map((flow) =>
        qaChecklistBuildTransformer({
          flow,
          packagesAffected: quest.packagesAffected,
          packageNames: scope.packageNames,
          track: scope.track,
        }),
      ),
      track: scope.track,
    };
  }

  const flows =
    flowId === undefined
      ? quest.flows
      : quest.flows.filter((flow) => String(flow.id) === String(flowId));

  return {
    checklists: flows.map((flow) =>
      qaChecklistBuildTransformer({ flow, packagesAffected: quest.packagesAffected }),
    ),
  };
};
