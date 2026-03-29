import { DependencyStepStub, StepFileReferenceStub } from '@dungeonmaster/shared/contracts';

import { questStepHasValidFocusFileGuard } from './quest-step-has-valid-focus-file-guard';

describe('questStepHasValidFocusFileGuard', () => {
  describe('valid focus files', () => {
    it('VALID: {empty steps array} => returns true', () => {
      const result = questStepHasValidFocusFileGuard({ steps: [] });

      expect(result).toBe(true);
    });

    it('VALID: {step with known folder type in focusFile path} => returns true', () => {
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.test.ts',
            }),
          ],
        }),
      ];

      const result = questStepHasValidFocusFileGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {step with multiple accompanyingFiles} => returns true', () => {
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/brokers/auth/login/auth-login-broker.ts',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/auth/login/auth-login-broker.test.ts',
            }),
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/auth/login/auth-login-broker.proxy.ts',
            }),
          ],
        }),
      ];

      const result = questStepHasValidFocusFileGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {step with no accompanyingFiles} => returns true', () => {
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'packages/shared/src/statics/config/config-statics.ts',
          }),
          accompanyingFiles: [],
        }),
      ];

      const result = questStepHasValidFocusFileGuard({ steps });

      expect(result).toBe(true);
    });
  });

  describe('invalid focus files', () => {
    it('INVALID: {focusFile path does not match known folder type} => returns false', () => {
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/unknown-folder/some-file.ts',
          }),
          accompanyingFiles: [],
        }),
      ];

      const result = questStepHasValidFocusFileGuard({ steps });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {multiple steps, one with unknown folder type} => returns false', () => {
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
          }),
          accompanyingFiles: [],
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/unknown/some-file.ts',
          }),
          accompanyingFiles: [],
        }),
      ];

      const result = questStepHasValidFocusFileGuard({ steps });

      expect(result).toBe(false);
    });

    it('EDGE: {focusFile path without src segment} => returns false', () => {
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/guards/is-valid/is-valid-guard.ts',
          }),
          accompanyingFiles: [],
        }),
      ];

      const result = questStepHasValidFocusFileGuard({ steps });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {steps: undefined} => returns false', () => {
      const result = questStepHasValidFocusFileGuard({});

      expect(result).toBe(false);
    });
  });
});
