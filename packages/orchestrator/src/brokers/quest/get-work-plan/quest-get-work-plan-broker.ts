/**
 * PURPOSE: Serves ONE operation item's plan as the markdown a planner reviews before signing it —
 * the batches in execution order, each piece's units, and the coverage table naming every in-scope
 * unit no piece claims. Reach for this over `questGetQuestWorkBroker` when the caller holds an
 * OPERATION ITEM rather than a work item: that one answers "what does this session run", and this
 * one answers "is the plan for this whole scope sound".
 *
 * USAGE:
 * await questGetWorkPlanBroker({ questId, operationItemId });
 * // Returns ContentText — the rendered plan, or the sentence saying no planner has run yet
 *
 * THE DENOMINATOR IS THE ITEM'S UNFILTERED SCOPE, taken at the family's ENTRY step. Every family's
 * entry is a step `stepScopeStatics.byFamilyStep` deliberately omits — a planner is assigned no
 * units and `sweepIn` holds none — so `stepInScopeUnitsTransformer` applies no kind, origin or
 * method narrowing there and returns every unit the item's own flows and packages hold. That, not
 * some later step's slice, is what a coverage review has to be measured against.
 *
 * AN ITEM WHOSE ROLE RUNS NO STEP GRAPH resolves to an empty denominator rather than throwing —
 * `spiritmender` and `warpgate` are measured on nothing, and a plan review over them is an honest
 * empty table.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract, stepNameContract } from '@dungeonmaster/shared/contracts';
import type { ContentText, OperationItemId, Quest, QuestId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { agentFlowStatics } from '../../../statics/agent-flow/agent-flow-statics';
import { questWorkUnitsTransformer } from '../../../transformers/quest-work-units/quest-work-units-transformer';
import { stepInScopeUnitsTransformer } from '../../../transformers/step-in-scope-units/step-in-scope-units-transformer';
import { workItemFamilyResolveTransformer } from '../../../transformers/work-item-family-resolve/work-item-family-resolve-transformer';
import { workPlanToTextTransformer } from '../../../transformers/work-plan-to-text/work-plan-to-text-transformer';
import { plannedWorkReadBroker } from '../../planned-work/read/planned-work-read-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

export const questGetWorkPlanBroker = async ({
  questId,
  operationItemId,
}: {
  questId: QuestId;
  operationItemId: OperationItemId;
}): Promise<ContentText> => {
  const { questPath } = await questFindQuestPathBroker({ questId });
  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );
  const quest: Quest = await questLoadBroker({ questFilePath });

  const operationItem = quest.operations.find((item) => item.id === operationItemId);

  if (operationItem === undefined) {
    throw new Error(
      `get-quest-work: operation item ${String(operationItemId)} is not on quest ${String(questId)}`,
    );
  }

  const family = workItemFamilyResolveTransformer({ quest, operationItem });
  const entryStep = Object.entries(agentFlowStatics)
    .filter((entry) => entry[0] === String(family))
    .map((entry) => entry[1].entry)
    .at(0);

  const inScopeUnitIds =
    entryStep === undefined
      ? []
      : stepInScopeUnitsTransformer({
          quest,
          operationItemId,
          step: stepNameContract.parse(entryStep),
        });

  const plan = await plannedWorkReadBroker({ questFolderPath: questPath, operationItemId });

  return workPlanToTextTransformer({
    operationItem,
    plan,
    inScopeUnits: questWorkUnitsTransformer({ quest, operationItem, unitIds: inScopeUnitIds }),
  });
};
