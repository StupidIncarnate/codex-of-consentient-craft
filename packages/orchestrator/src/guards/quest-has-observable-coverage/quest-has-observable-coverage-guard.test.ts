import {
  DependencyStepStub,
  ObservableStub,
  ObservableIdStub,
} from '@dungeonmaster/shared/contracts';

import { questHasObservableCoverageGuard } from './quest-has-observable-coverage-guard';

describe('questHasObservableCoverageGuard', () => {
  describe('valid coverage', () => {
    it('VALID: {all observables covered by steps} => returns true', () => {
      const obsId1 = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const obsId2 = ObservableIdStub({ value: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e' });
      const observables = [ObservableStub({ id: obsId1 }), ObservableStub({ id: obsId2 })];
      const steps = [DependencyStepStub({ observablesSatisfied: [obsId1, obsId2] })];

      const result = questHasObservableCoverageGuard({ observables, steps });

      expect(result).toBe(true);
    });

    it('VALID: {observables covered across multiple steps} => returns true', () => {
      const obsId1 = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const obsId2 = ObservableIdStub({ value: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e' });
      const observables = [ObservableStub({ id: obsId1 }), ObservableStub({ id: obsId2 })];
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

      const result = questHasObservableCoverageGuard({ observables, steps });

      expect(result).toBe(true);
    });

    it('VALID: {empty observables array} => returns true', () => {
      const observables: ReturnType<typeof ObservableStub>[] = [];
      const steps = [DependencyStepStub()];

      const result = questHasObservableCoverageGuard({ observables, steps });

      expect(result).toBe(true);
    });
  });

  describe('invalid coverage', () => {
    it('INVALID_COVERAGE: {observable not in any step} => returns false', () => {
      const obsId1 = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const obsId2 = ObservableIdStub({ value: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e' });
      const observables = [ObservableStub({ id: obsId1 }), ObservableStub({ id: obsId2 })];
      const steps = [DependencyStepStub({ observablesSatisfied: [obsId1] })];

      const result = questHasObservableCoverageGuard({ observables, steps });

      expect(result).toBe(false);
    });

    it('INVALID_COVERAGE: {no steps have observablesSatisfied} => returns false', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const observables = [ObservableStub({ id: obsId })];
      const steps = [DependencyStepStub({ observablesSatisfied: [] })];

      const result = questHasObservableCoverageGuard({ observables, steps });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {observables: undefined} => returns false', () => {
      const result = questHasObservableCoverageGuard({ steps: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: {steps: undefined} => returns false', () => {
      const result = questHasObservableCoverageGuard({ observables: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: {both undefined} => returns false', () => {
      const result = questHasObservableCoverageGuard({});

      expect(result).toBe(false);
    });
  });
});
