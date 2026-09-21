/**
 * PURPOSE: Identifies WHICH of the nineteen plan-validation checks a `WorkPlanValidationFailure`
 * failed, by the same number the design table in `scrolls/orcha-changes/08-plan-validation.md`
 * uses. The domain runs 1 through 19 even though `workPlanValidateTransformer` never emits 18 of
 * them for two different reasons: 11 and half of 17 are refused earlier, at `workPlanContract`'s
 * own parse step, and 19 ("a walk piece whose path needs a seeded system names a recipe") has no
 * predicate in this repo that can answer whether a given path needs a seeded system — it is named
 * here so a future implementation is a pure addition to the validator, not a widening of this
 * contract's range.
 *
 * USAGE:
 * workPlanValidationCheckContract.parse(5);
 * // Returns a branded WorkPlanValidationCheck naming check #5, the in-scope-assigned-unit check
 */

import { z } from 'zod';

import { workPlanValidationCheckStatics } from '../../statics/work-plan-validation-check/work-plan-validation-check-statics';

export const workPlanValidationCheckContract = z
  .number()
  .int()
  .min(1)
  .max(workPlanValidationCheckStatics.limits.max)
  .brand<'WorkPlanValidationCheck'>();

export type WorkPlanValidationCheck = z.infer<typeof workPlanValidationCheckContract>;
