import { DependencyStepStub, StepIdStub } from '@dungeonmaster/shared/contracts';

import { questHasDependencyIntegrityGuard } from './quest-has-dependency-integrity-guard';

describe('questHasDependencyIntegrityGuard', () => {
  describe('valid dependencies', () => {
    it('VALID: {steps with no dependencies} => returns true', () => {
      const steps = [
        DependencyStepStub({ id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b', dependsOn: [] }),
      ];

      const result = questHasDependencyIntegrityGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {step depends on existing step} => returns true', () => {
      const stepId1 = StepIdStub({ value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' });
      const stepId2 = StepIdStub({ value: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c' });
      const steps = [
        DependencyStepStub({ id: stepId1, dependsOn: [] }),
        DependencyStepStub({ id: stepId2, dependsOn: [stepId1] }),
      ];

      const result = questHasDependencyIntegrityGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {empty steps array} => returns true', () => {
      const result = questHasDependencyIntegrityGuard({ steps: [] });

      expect(result).toBe(true);
    });
  });

  describe('invalid dependencies', () => {
    it('INVALID_DEPENDENCY: {step depends on non-existent step} => returns false', () => {
      const nonExistentId = StepIdStub({ value: 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee' });
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          dependsOn: [nonExistentId],
        }),
      ];

      const result = questHasDependencyIntegrityGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID_DEPENDENCY: {one valid, one invalid dependency} => returns false', () => {
      const stepId1 = StepIdStub({ value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' });
      const nonExistentId = StepIdStub({ value: 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee' });
      const steps = [
        DependencyStepStub({ id: stepId1, dependsOn: [] }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          dependsOn: [stepId1, nonExistentId],
        }),
      ];

      const result = questHasDependencyIntegrityGuard({ steps });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {steps: undefined} => returns false', () => {
      const result = questHasDependencyIntegrityGuard({});

      expect(result).toBe(false);
    });
  });
});
