import {
  DependencyStepStub,
  StepFileReferenceStub,
  StepFocusActionStub,
} from '@dungeonmaster/shared/contracts';

import { questStepHasFocusTargetGuard } from './quest-step-has-focus-target-guard';

describe('questStepHasFocusTargetGuard', () => {
  describe('valid steps', () => {
    it('VALID: {step with focusFile only} => returns true', () => {
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'src/brokers/auth/login/auth-login-broker.ts',
          }),
        }),
      ];

      const result = questStepHasFocusTargetGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {step with focusAction only} => returns true', () => {
      const steps = [
        DependencyStepStub({
          focusFile: undefined,
          focusAction: StepFocusActionStub({
            kind: 'verification',
            description: 'Run ward and assert zero failures',
          }),
        }),
      ];

      const result = questStepHasFocusTargetGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {mixed focusFile and focusAction across steps, all exactly one} => returns true', () => {
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          focusFile: StepFileReferenceStub({
            path: 'src/brokers/auth/login/auth-login-broker.ts',
          }),
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          focusFile: undefined,
          focusAction: StepFocusActionStub({
            kind: 'sweep-check',
            description: 'Assert no remaining raw string types in adapters',
          }),
        }),
      ];

      const result = questStepHasFocusTargetGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {empty steps array} => returns true', () => {
      const result = questStepHasFocusTargetGuard({ steps: [] });

      expect(result).toBe(true);
    });
  });

  describe('invalid steps', () => {
    it('INVALID: {step with neither focusFile nor focusAction} => returns false', () => {
      const steps = [
        DependencyStepStub({
          focusFile: undefined,
        }),
      ];

      const result = questStepHasFocusTargetGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID: {step with both focusFile and focusAction} => returns false', () => {
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'src/brokers/auth/login/auth-login-broker.ts',
          }),
          focusAction: StepFocusActionStub({
            kind: 'verification',
            description: 'Run ward and assert zero failures',
          }),
        }),
      ];

      const result = questStepHasFocusTargetGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID: {multiple steps, one has neither} => returns false', () => {
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          focusFile: StepFileReferenceStub({
            path: 'src/brokers/auth/login/auth-login-broker.ts',
          }),
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          focusFile: undefined,
        }),
      ];

      const result = questStepHasFocusTargetGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID: {multiple steps, one has both} => returns false', () => {
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          focusFile: StepFileReferenceStub({
            path: 'src/brokers/auth/login/auth-login-broker.ts',
          }),
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          focusFile: StepFileReferenceStub({
            path: 'src/guards/is-valid/is-valid-guard.ts',
          }),
          focusAction: StepFocusActionStub({
            kind: 'command',
            description: 'Run npm run build',
          }),
        }),
      ];

      const result = questStepHasFocusTargetGuard({ steps });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {steps: undefined} => returns false', () => {
      const result = questStepHasFocusTargetGuard({});

      expect(result).toBe(false);
    });
  });
});
