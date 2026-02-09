import { DependencyStepStub, ObservableIdStub } from '@dungeonmaster/shared/contracts';

import { questHasNoOrphanStepsGuard } from './quest-has-no-orphan-steps-guard';

describe('questHasNoOrphanStepsGuard', () => {
  describe('valid steps', () => {
    it('VALID: {all steps satisfy observables} => returns true', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [DependencyStepStub({ observablesSatisfied: [obsId] })];

      const result = questHasNoOrphanStepsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {multiple steps all satisfy observables} => returns true', () => {
      const obsId1 = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const obsId2 = ObservableIdStub({ value: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e' });
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          observablesSatisfied: [obsId1],
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          observablesSatisfied: [obsId2],
        }),
      ];

      const result = questHasNoOrphanStepsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {empty steps array} => returns true', () => {
      const result = questHasNoOrphanStepsGuard({ steps: [] });

      expect(result).toBe(true);
    });
  });

  describe('orphan steps', () => {
    it('INVALID_ORPHAN: {step with empty observablesSatisfied} => returns false', () => {
      const steps = [DependencyStepStub({ observablesSatisfied: [] })];

      const result = questHasNoOrphanStepsGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID_ORPHAN: {one valid, one orphan step} => returns false', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          observablesSatisfied: [obsId],
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          observablesSatisfied: [],
        }),
      ];

      const result = questHasNoOrphanStepsGuard({ steps });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {steps: undefined} => returns false', () => {
      const result = questHasNoOrphanStepsGuard({});

      expect(result).toBe(false);
    });
  });
});
