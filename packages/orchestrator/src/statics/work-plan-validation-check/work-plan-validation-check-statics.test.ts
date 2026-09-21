import { workPlanValidationCheckStatics } from './work-plan-validation-check-statics';

describe('workPlanValidationCheckStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(workPlanValidationCheckStatics).toStrictEqual({
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
    });
  });
});
