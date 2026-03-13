import { DependencyStepStub, ObservableIdStub, StepIdStub } from '@dungeonmaster/shared/contracts';

import { failedObservablesToStepIdsTransformer } from './failed-observables-to-step-ids-transformer';

describe('failedObservablesToStepIdsTransformer', () => {
  describe('valid transformations', () => {
    it('VALID: {single failed observable matching one step} => returns that step id', () => {
      const obsId = ObservableIdStub({ value: 'login-redirects-to-dashboard' });
      const stepId = StepIdStub({ value: 'create-login-api' });
      const steps = [
        DependencyStepStub({
          id: stepId,
          observablesSatisfied: [obsId],
        }),
        DependencyStepStub({
          id: StepIdStub({ value: 'create-auth-guard' }),
          observablesSatisfied: [ObservableIdStub({ value: 'shows-error-on-invalid-creds' })],
        }),
      ];

      const result = failedObservablesToStepIdsTransformer({
        failedObservableIds: [obsId],
        steps,
      });

      expect(result).toStrictEqual([stepId]);
    });

    it('VALID: {multiple failed observables matching multiple steps} => returns all matching step ids', () => {
      const obsA = ObservableIdStub({ value: 'login-redirects-to-dashboard' });
      const obsB = ObservableIdStub({ value: 'shows-error-on-invalid-creds' });
      const stepA = StepIdStub({ value: 'create-login-api' });
      const stepB = StepIdStub({ value: 'create-auth-guard' });
      const steps = [
        DependencyStepStub({ id: stepA, observablesSatisfied: [obsA] }),
        DependencyStepStub({ id: stepB, observablesSatisfied: [obsB] }),
      ];

      const result = failedObservablesToStepIdsTransformer({
        failedObservableIds: [obsA, obsB],
        steps,
      });

      expect(result).toStrictEqual([stepA, stepB]);
    });

    it('VALID: {failed observable not matching any step} => returns empty array', () => {
      const obsId = ObservableIdStub({ value: 'unknown-observable' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [ObservableIdStub({ value: 'login-redirects-to-dashboard' })],
        }),
      ];

      const result = failedObservablesToStepIdsTransformer({
        failedObservableIds: [obsId],
        steps,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {no failed observables} => returns empty array', () => {
      const result = failedObservablesToStepIdsTransformer({
        failedObservableIds: [],
        steps: [DependencyStepStub()],
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {no steps} => returns empty array', () => {
      const obsId = ObservableIdStub({ value: 'login-redirects-to-dashboard' });

      const result = failedObservablesToStepIdsTransformer({
        failedObservableIds: [obsId],
        steps: [],
      });

      expect(result).toStrictEqual([]);
    });
  });
});
