/**
 * PURPOSE: The domain for `workPlanValidationCheckContract` — the nineteen checks a submitted plan
 * is measured against, per `scrolls/orcha-changes/08-plan-validation.md`, plus a named number for
 * each check `workPlanValidateTransformer` emits so its own body never carries a bare digit.
 * Checks 11 and half of 17 carry no number here because they are refused earlier, at
 * `workPlanContract`'s own parse step, and never reach the transformer's own checks at all. Check
 * 19 ("a walk piece whose path needs a seeded system names a recipe") has no predicate in this repo
 * that can answer whether a given path needs a seeded system, so `workPlanValidateTransformer`
 * never emits it either — `limits.max` stays 19 anyway so the contract's range already fits a
 * future implementation without widening.
 *
 * USAGE:
 * workPlanValidationCheckStatics.numbers.outOfScopeAssignedUnit;
 * // Returns 5 — the in-scope-assigned-unit check
 */

export const workPlanValidationCheckStatics = {
  limits: {
    max: 19,
  },
  numbers: {
    operationItemMismatch: 1,
    duplicatePieceId: 2,
    unknownStep: 3,
    unresolvedUnit: 4,
    outOfScopeAssignedUnit: 5,
    duplicateUnitClaim: 6,
    unknownFlow: 7,
    unknownPackage: 8,
    fileOutsideOwnedPackage: 9,
    duplicateFilePath: 10,
    observableTargetMismatch: 12,
    batchConcurrency: 13,
    batchMixedSteps: 14,
    adversarialBaseline: 15,
    duplicateOffMapFamily: 16,
    plannerMarkUnresolvedUnit: 17,
    recipeNotRecorded: 18,
  },
} as const;
