import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { questIncompleteNewStepsTransformer } from './quest-incomplete-new-steps-transformer';

describe('questIncompleteNewStepsTransformer', () => {
  describe('complete new steps', () => {
    it('VALID: {new step with full shape} => no offenders', () => {
      const step = DependencyStepStub({ id: 'web-create-broker' as never });

      const result = questIncompleteNewStepsTransformer({
        steps: [step],
        existingStepIds: new Set(),
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {steps: []} => no offenders', () => {
      const result = questIncompleteNewStepsTransformer({
        steps: [],
        existingStepIds: new Set(),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('incomplete new steps', () => {
    it('INVALID: {new step missing assertions} => offender names assertions', () => {
      const result = questIncompleteNewStepsTransformer({
        steps: [
          {
            id: 'web-quest-delete-e2e',
            slice: 'web',
            name: 'Delete quest e2e',
            observablesSatisfied: [],
            dependsOn: [],
            accompanyingFiles: [],
            inputContracts: ['Void'],
            outputContracts: ['Void'],
          },
        ],
        existingStepIds: new Set(),
      });

      expect(result).toStrictEqual([
        "step 'web-quest-delete-e2e' is a new step but is missing or has invalid required fields: assertions",
      ]);
    });
  });

  describe('non-new or deleted steps are skipped', () => {
    it('VALID: {partial-patch of an existing step} => skipped, no offender', () => {
      const result = questIncompleteNewStepsTransformer({
        steps: [{ id: 'web-existing-step', instructions: ['tweak a thing'] }],
        existingStepIds: new Set(['web-existing-step']),
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {delete-marker for a new id} => skipped, no offender', () => {
      const result = questIncompleteNewStepsTransformer({
        steps: [{ id: 'web-old-step', _delete: true }],
        existingStepIds: new Set(),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
