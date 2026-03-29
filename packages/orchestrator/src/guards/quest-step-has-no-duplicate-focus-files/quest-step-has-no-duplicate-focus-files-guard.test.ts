import { DependencyStepStub, StepFileReferenceStub } from '@dungeonmaster/shared/contracts';

import { questStepHasNoDuplicateFocusFilesGuard } from './quest-step-has-no-duplicate-focus-files-guard';

describe('questStepHasNoDuplicateFocusFilesGuard', () => {
  describe('valid steps', () => {
    it('VALID: {empty steps array} => returns true', () => {
      const result = questStepHasNoDuplicateFocusFilesGuard({ steps: [] });

      expect(result).toBe(true);
    });

    it('VALID: {single step} => returns true', () => {
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'src/guards/is-valid/is-valid-guard.ts',
          }),
        }),
      ];

      const result = questStepHasNoDuplicateFocusFilesGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {multiple steps with unique focusFile paths} => returns true', () => {
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          focusFile: StepFileReferenceStub({
            path: 'src/guards/is-valid/is-valid-guard.ts',
          }),
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          focusFile: StepFileReferenceStub({
            path: 'src/brokers/auth/login/auth-login-broker.ts',
          }),
        }),
      ];

      const result = questStepHasNoDuplicateFocusFilesGuard({ steps });

      expect(result).toBe(true);
    });
  });

  describe('duplicate focus files', () => {
    it('INVALID: {two steps with same focusFile path} => returns false', () => {
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          focusFile: StepFileReferenceStub({
            path: 'src/guards/is-valid/is-valid-guard.ts',
          }),
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          focusFile: StepFileReferenceStub({
            path: 'src/guards/is-valid/is-valid-guard.ts',
          }),
        }),
      ];

      const result = questStepHasNoDuplicateFocusFilesGuard({ steps });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {three steps, only two share a path} => returns false', () => {
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          focusFile: StepFileReferenceStub({
            path: 'src/guards/is-valid/is-valid-guard.ts',
          }),
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          focusFile: StepFileReferenceStub({
            path: 'src/brokers/auth/login/auth-login-broker.ts',
          }),
        }),
        DependencyStepStub({
          id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          focusFile: StepFileReferenceStub({
            path: 'src/guards/is-valid/is-valid-guard.ts',
          }),
        }),
      ];

      const result = questStepHasNoDuplicateFocusFilesGuard({ steps });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {steps: undefined} => returns false', () => {
      const result = questStepHasNoDuplicateFocusFilesGuard({});

      expect(result).toBe(false);
    });
  });
});
