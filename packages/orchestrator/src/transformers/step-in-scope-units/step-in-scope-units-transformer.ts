/**
 * PURPOSE: The units ONE step of ONE operation item is answerable for — the item's own flows and
 * packages, narrowed again by what that step is measured over. This is the denominator itself,
 * settled units included and no claim made about whether any of them are — reach for
 * `stepOutstandingUnitsTransformer` instead when the question is which of those units nothing has
 * settled yet.
 *
 * USAGE:
 * stepInScopeUnitsTransformer({ quest, operationItemId, step: 'adversarial' });
 * // Returns UnitId[] — every unit that step owns, settled or not
 *
 * THE FAMILY IS NOT A PARAMETER. It is `operationItem.role`, which is the key
 * `stepScopeStatics.byFamilyStep` is keyed on. A separate `family` argument would be a second way to
 * ask a question the item already answers, and the two can disagree.
 *
 * A ROLE OUTSIDE THE THREE FAMILIES RETURNS `[]` AND DOES NOT THROW — `spiritmender` and `warpgate`
 * are measured on nothing, which is an honest empty answer rather than an error. An
 * `operationItemId` that resolves to NO item is the opposite case and throws: an absent item is a
 * caller bug, and returning `[]` for it is indistinguishable from a genuinely empty scope, which is
 * the reading that turns a gate off silently.
 *
 * THE FLOW NARROWING READS `stepScopeStatics`'s OWN `flowTypes`, per (family, step) rather than per
 * track. Both siege STEPS carry `['runtime']` alone, narrower than codeweaver's and flowrider's
 * `['runtime', 'operational']`, because an operational flow's siege units settle in codeweaver's
 * reviewer instead — the only family that can.
 *
 * AN ITEM DECLARING NO `flowIds` MATCHES NO FLOW. That is what keeps a flow-less quest and a
 * track-less item completable, and it is not a bug to "fix" into a whole-quest scope.
 *
 * `qaUnitEnumerateTransformer` IS CALLED UNCHANGED, because it is the single enumeration: ids are
 * derived from the graph, so a second derivation drifts and nothing reports it.
 */

import type { OperationItemId, Quest, StepName, UnitId } from '@dungeonmaster/shared/contracts';
import { unitIdContract } from '@dungeonmaster/shared/contracts';

import { stepScopeStatics } from '../../statics/step-scope/step-scope-statics';
import { qaUnitEnumerateTransformer } from '../qa-unit-enumerate/qa-unit-enumerate-transformer';
import { qaUnitsInPackageScopeTransformer } from '../qa-units-in-package-scope/qa-units-in-package-scope-transformer';

type StepScopes = typeof stepScopeStatics.byFamilyStep;
type StepFamily = keyof StepScopes;
// The union of every family's step entries. `keyof (A | B)` is the INTERSECTION of their keys, which
// is `never` here — the families do not share a step name — so the union is built per family and
// then collapsed.
type StepScope = {
  [Family in StepFamily]: StepScopes[Family][keyof StepScopes[Family]];
}[StepFamily];

export const stepInScopeUnitsTransformer = ({
  quest,
  operationItemId,
  step,
}: {
  quest: Quest;
  operationItemId: OperationItemId;
  step: StepName;
}): UnitId[] => {
  const operationItem = quest.operations.find((item) => item.id === operationItemId);

  if (operationItem === undefined) {
    throw new Error(
      `stepInScopeUnitsTransformer: quest '${String(quest.id)}' holds no operation item '${String(operationItemId)}'`,
    );
  }

  if (
    operationItem.role !== 'codeweaver' &&
    operationItem.role !== 'flowrider' &&
    operationItem.role !== 'siegemaster'
  ) {
    return [];
  }

  const family: StepFamily = operationItem.role;
  const familySteps: Record<StepName, StepScope> = stepScopeStatics.byFamilyStep[family];
  const declaredScope = familySteps[step];

  // A step with NO declared scope inherits its family's whole in-scope set UNFILTERED. Every
  // `worker` step and every `planner` step is deliberately absent from `byFamilyStep` — a worker is
  // handed the units its piece assigns and a planner is assigned none — so `undefined` here is that
  // documented case rather than a lookup miss, and `null` below reads as "no filter".
  const eligible =
    declaredScope === undefined
      ? null
      : {
          flowTypes: new Set(declaredScope.flowTypes),
          kinds: new Set(declaredScope.unitKinds),
          origins: new Set(declaredScope.observableOrigins),
          methods: new Set(declaredScope.verificationMethods),
        };

  const scopedFlowIds = new Set(operationItem.flowIds.map(String));

  const flows = quest.flows.filter(
    (flow) =>
      scopedFlowIds.has(String(flow.id)) &&
      (eligible === null || eligible.flowTypes.has(flow.flowType)),
  );

  return flows.flatMap((flow) => {
    const kindAndOriginUnits = qaUnitEnumerateTransformer({ flow })
      .filter((unit) => eligible === null || eligible.kinds.has(unit.kind))
      .filter(
        (unit) =>
          eligible === null || unit.kind !== 'observable' || eligible.origins.has(unit.addedBy),
      )
      .filter((unit) => {
        if (eligible === null || unit.kind !== 'observable') {
          return true;
        }

        // `verifyByHuman` wins over `verifyByReading` when an observable carries both — it names
        // the METHOD nothing automated can perform, where `verifyByReading` only names which
        // automated method applies.
        if (unit.verifyByHuman === true) {
          return eligible.methods.has('human-check');
        }

        return eligible.methods.has(unit.verifyByReading === true ? 'reading' : 'test');
      });

    // The family name IS a valid track key — `stepScopeStatics.byFamilyStep` holds exactly these
    // three families, each declaring the same package kinds, so this narrowing gives the identical
    // answer whichever family asks.
    return qaUnitsInPackageScopeTransformer({
      flow,
      units: kindAndOriginUnits,
      track: family,
      packagesAffected: quest.packagesAffected,
      packageNames: operationItem.packageNames,
      // The seam rule's depth tiebreak. Handed over rather than defaulted, so a step's scope and
      // the fan-out that minted its cell order the same two packages the same way.
      packageGraph: quest.packageGraph,
    }).map((unit) => unitIdContract.parse(unit.id));
  });
};
