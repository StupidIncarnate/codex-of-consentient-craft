/**
 * PURPOSE: Names the step whose in-scope set is a family's WHOLE unfiltered unit set — the step
 * `stepScopeStatics.unscopedByFamilyStep` declares `all`. Reach for this when a caller needs every
 * unit an operation item holds (a plan's coverage review) rather than one
 * step's own slice, and pass its answer to `stepInScopeUnitsTransformer` as the `step`.
 *
 * USAGE:
 * familyWholeScopeStepTransformer({ family: 'siegemaster' });
 * // Returns 'plan'
 * familyWholeScopeStepTransformer({ family: 'wardFull' });
 * // Returns undefined — a family that measures no units has no whole-scope step
 *
 * IT READS THE TABLE RATHER THAN A STEP NAME, so a family whose planner is renamed keeps working and
 * a family with no `all` step answers `undefined` instead of a step `stepInScopeUnitsTransformer`
 * would throw on.
 */

import { stepScopeStatics } from '../../statics/step-scope/step-scope-statics';

export const familyWholeScopeStepTransformer = ({
  family,
}: {
  family: string;
}): string | undefined => {
  const unscopedSteps = new Map(Object.entries(stepScopeStatics.unscopedByFamilyStep)).get(family);

  if (unscopedSteps === undefined) {
    return undefined;
  }

  return Object.entries(unscopedSteps)
    .filter((entry) => entry[1] === 'all')
    .map((entry) => entry[0])
    .at(0);
};
