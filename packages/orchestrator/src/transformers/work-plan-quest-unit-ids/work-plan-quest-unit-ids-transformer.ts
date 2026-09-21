/**
 * PURPOSE: Every real unit id on the WHOLE quest — every terminal, branch, observable and off-map
 * family, across every flow — for check 4's "resolves to a real unit on the quest" test and check
 * 17's identical re-check on a `plannerMarks` entry. Deliberately the WHOLE quest rather than one
 * operation item's scope: check 4 asks only whether a claimed id is real, and check 5 (the in-scope
 * gate, `operationSignoffScopeTransformer` + `qaChecklistBuildTransformer`) is the separate,
 * narrower question of whether an assigned unit belongs to THIS operation item.
 *
 * USAGE:
 * workPlanQuestUnitIdsTransformer({ quest });
 * // Returns UnitId[] — every id qaUnitEnumerateTransformer would mint for any flow on this quest
 *
 * Re-brands `qaUnitEnumerateTransformer`'s `QaChecklistItemId` ids into `UnitId`: the two contracts
 * validate byte-identically (see `unitIdContract`'s own header), and re-parsing is how a value moves
 * across a brand boundary in this codebase.
 */

import { unitIdContract } from '@dungeonmaster/shared/contracts';
import type { Quest, UnitId } from '@dungeonmaster/shared/contracts';

import { qaUnitEnumerateTransformer } from '../qa-unit-enumerate/qa-unit-enumerate-transformer';

export const workPlanQuestUnitIdsTransformer = ({ quest }: { quest: Quest }): UnitId[] =>
  quest.flows.flatMap((flow) =>
    qaUnitEnumerateTransformer({ flow }).map((unit) => unitIdContract.parse(String(unit.id))),
  );
