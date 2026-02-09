import { DependencyStepStub, StepIdStub } from '@dungeonmaster/shared/contracts';

import { questHasNoCircularDepsGuard } from './quest-has-no-circular-deps-guard';

describe('questHasNoCircularDepsGuard', () => {
  describe('valid DAG', () => {
    it('VALID: {linear dependency chain} => returns true', () => {
      const stepId1 = StepIdStub({ value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' });
      const stepId2 = StepIdStub({ value: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c' });
      const stepId3 = StepIdStub({ value: 'a7b8c9d0-e1f2-4a3b-c4d5-6e7f8a9b0c1d' });
      const steps = [
        DependencyStepStub({ id: stepId1, dependsOn: [] }),
        DependencyStepStub({ id: stepId2, dependsOn: [stepId1] }),
        DependencyStepStub({ id: stepId3, dependsOn: [stepId2] }),
      ];

      const result = questHasNoCircularDepsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {diamond dependency shape} => returns true', () => {
      const stepId1 = StepIdStub({ value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' });
      const stepId2 = StepIdStub({ value: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c' });
      const stepId3 = StepIdStub({ value: 'a7b8c9d0-e1f2-4a3b-c4d5-6e7f8a9b0c1d' });
      const stepId4 = StepIdStub({ value: 'b8c9d0e1-f2a3-4b4c-d5e6-7f8a9b0c1d2e' });
      const steps = [
        DependencyStepStub({ id: stepId1, dependsOn: [] }),
        DependencyStepStub({ id: stepId2, dependsOn: [stepId1] }),
        DependencyStepStub({ id: stepId3, dependsOn: [stepId1] }),
        DependencyStepStub({ id: stepId4, dependsOn: [stepId2, stepId3] }),
      ];

      const result = questHasNoCircularDepsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {no dependencies} => returns true', () => {
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          dependsOn: [],
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          dependsOn: [],
        }),
      ];

      const result = questHasNoCircularDepsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {empty steps array} => returns true', () => {
      const result = questHasNoCircularDepsGuard({ steps: [] });

      expect(result).toBe(true);
    });
  });

  describe('circular dependencies', () => {
    it('INVALID_CYCLE: {A depends on B, B depends on A} => returns false', () => {
      const stepId1 = StepIdStub({ value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' });
      const stepId2 = StepIdStub({ value: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c' });
      const steps = [
        DependencyStepStub({ id: stepId1, dependsOn: [stepId2] }),
        DependencyStepStub({ id: stepId2, dependsOn: [stepId1] }),
      ];

      const result = questHasNoCircularDepsGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID_CYCLE: {A -> B -> C -> A} => returns false', () => {
      const stepId1 = StepIdStub({ value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' });
      const stepId2 = StepIdStub({ value: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c' });
      const stepId3 = StepIdStub({ value: 'a7b8c9d0-e1f2-4a3b-c4d5-6e7f8a9b0c1d' });
      const steps = [
        DependencyStepStub({ id: stepId1, dependsOn: [stepId3] }),
        DependencyStepStub({ id: stepId2, dependsOn: [stepId1] }),
        DependencyStepStub({ id: stepId3, dependsOn: [stepId2] }),
      ];

      const result = questHasNoCircularDepsGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID_CYCLE: {self-dependency} => returns false', () => {
      const stepId = StepIdStub({ value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' });
      const steps = [DependencyStepStub({ id: stepId, dependsOn: [stepId] })];

      const result = questHasNoCircularDepsGuard({ steps });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {steps: undefined} => returns false', () => {
      const result = questHasNoCircularDepsGuard({});

      expect(result).toBe(false);
    });
  });
});
