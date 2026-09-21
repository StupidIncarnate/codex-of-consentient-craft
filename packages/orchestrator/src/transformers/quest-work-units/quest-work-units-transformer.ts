/**
 * PURPOSE: Turns a list of unit ids into the rows `get-quest-work` serves for them — each unit's
 * verbatim text, the surface to check it at, its graph anchor, and whatever the record currently
 * says about it. Reach for this over `qaChecklistBuildTransformer` whenever the caller already
 * HOLDS the ids it wants: that one enumerates a whole flow and answers "what is here", where this
 * one joins a named set to the marks on it and answers "what do I still owe".
 *
 * USAGE:
 * questWorkUnitsTransformer({ quest, operationItem, unitIds });
 * // Returns QuestWorkUnit[] in the order the ids were given
 *
 * `surface` IS THE BUILT ITEM's `checkSurface` AND IS NEVER RE-DERIVED. The trap is
 * `qaCheckSurfaceStatics.byOutcomeType[observableType]`: `observableType` is present on the
 * `observable` kind alone, so that route leaves a terminal, a labelled branch and an off-map family
 * with an empty surface — three of the four kinds, silently. `qaChecklistBuildTransformer` already
 * fills all four from `byKind` and the `readCheck` override, so calling it is the whole answer.
 *
 * AN ID THE SCOPE'S FLOWS DO NOT HOLD IS DROPPED RATHER THAN SERVED BLANK. A unit that enumerates
 * nowhere has no verbatim text and no surface, and a row carrying placeholders for both is a row a
 * session would try to settle against nothing. The gate measures `workItem.assignedUnitIds`, so a
 * dropped row is visible as a shorter list against a denominator the router wrote.
 *
 * THE MARK COMES FROM `unitCurrentMarkTransformer`, so the answer here and the answer the router
 * routes on are the same read — assignment-keyed, which is what makes a session that was handed a
 * unit and died read as outstanding rather than as whatever the last completed session said.
 */

import type { OperationItem, Quest, UnitId } from '@dungeonmaster/shared/contracts';

import type { QuestWorkUnit } from '../../contracts/quest-work-view/quest-work-view-contract';
import { qaChecklistBuildTransformer } from '../qa-checklist-build/qa-checklist-build-transformer';
import { unitCurrentMarkTransformer } from '../unit-current-mark/unit-current-mark-transformer';

export const questWorkUnitsTransformer = ({
  quest,
  operationItem,
  unitIds,
}: {
  quest: Quest;
  operationItem: OperationItem;
  unitIds: readonly UnitId[];
}): QuestWorkUnit[] => {
  const scopedFlowIds = new Set(operationItem.flowIds.map(String));

  const items = quest.flows
    .filter((flow) => scopedFlowIds.has(String(flow.id)))
    .flatMap(
      (flow) =>
        qaChecklistBuildTransformer({
          flow,
          packagesAffected: quest.packagesAffected,
          packageNames: operationItem.packageNames,
        }).items,
    );

  const itemsById = new Map(items.map((item) => [String(item.id), item]));

  return unitIds.flatMap((unitId) => {
    const item = itemsById.get(String(unitId));

    if (item === undefined) {
      return [];
    }

    const current = unitCurrentMarkTransformer({ quest, unitId });

    return [
      {
        unitId,
        kind: item.kind,
        text: item.label,
        surface: item.checkSurface,
        nodeId: item.nodeId ?? null,
        edgeId: item.edgeId ?? null,
        observableType: item.observableType ?? null,
        verifyByReading: item.verifyByReading ?? false,
        mark: current?.mark ?? null,
        evidence: current?.evidence ?? null,
        toSettle: current?.toSettle ?? null,
        markedBy: current?.workItemId ?? null,
        markedAt: current?.at ?? null,
      },
    ];
  });
};
