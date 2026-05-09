import {
  DependencyStepStub,
  StepFileReferenceStub,
  StepFocusActionStub,
} from '@dungeonmaster/shared/contracts';

import { questDuplicateStepFocusFilesTransformer } from './quest-duplicate-step-focus-files-transformer';

describe('questDuplicateStepFocusFilesTransformer', () => {
  describe('no duplicates', () => {
    it('VALID: {unique focusFile paths} => returns []', () => {
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

      const result = questDuplicateStepFocusFilesTransformer({ steps });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {single step} => returns []', () => {
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'src/guards/is-valid/is-valid-guard.ts',
          }),
        }),
      ];

      const result = questDuplicateStepFocusFilesTransformer({ steps });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {mixed focusFile and focusAction-only steps, all focusFile paths unique} => returns []', () => {
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          focusFile: StepFileReferenceStub({
            path: 'src/guards/is-valid/is-valid-guard.ts',
          }),
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          focusFile: undefined,
          focusAction: StepFocusActionStub({
            kind: 'verification',
            description: 'Run ward and assert zero failures',
          }),
        }),
        DependencyStepStub({
          id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          focusFile: StepFileReferenceStub({
            path: 'src/brokers/auth/login/auth-login-broker.ts',
          }),
        }),
      ];

      const result = questDuplicateStepFocusFilesTransformer({ steps });

      expect(result).toStrictEqual([]);
    });
  });

  describe('duplicates present', () => {
    it('INVALID: {two steps share focusFile path} => returns the duplicated path', () => {
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

      const result = questDuplicateStepFocusFilesTransformer({ steps });

      expect(result).toStrictEqual(['src/guards/is-valid/is-valid-guard.ts']);
    });

    it('INVALID: {three steps share focusFile path} => returns the duplicated path once', () => {
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
        DependencyStepStub({
          id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          focusFile: StepFileReferenceStub({
            path: 'src/guards/is-valid/is-valid-guard.ts',
          }),
        }),
      ];

      const result = questDuplicateStepFocusFilesTransformer({ steps });

      expect(result).toStrictEqual(['src/guards/is-valid/is-valid-guard.ts']);
    });

    it('INVALID: {two distinct duplicate paths} => returns both duplicates', () => {
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
        DependencyStepStub({
          id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          focusFile: StepFileReferenceStub({
            path: 'src/brokers/auth/login/auth-login-broker.ts',
          }),
        }),
        DependencyStepStub({
          id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
          focusFile: StepFileReferenceStub({
            path: 'src/brokers/auth/login/auth-login-broker.ts',
          }),
        }),
      ];

      const result = questDuplicateStepFocusFilesTransformer({ steps });

      expect(result).toStrictEqual([
        'src/guards/is-valid/is-valid-guard.ts',
        'src/brokers/auth/login/auth-login-broker.ts',
      ]);
    });

    it('INVALID: {duplicate focusFile paths across mixed focusAction steps} => returns only the file duplicates', () => {
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          focusFile: StepFileReferenceStub({
            path: 'src/guards/is-valid/is-valid-guard.ts',
          }),
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          focusFile: undefined,
          focusAction: StepFocusActionStub({
            kind: 'verification',
            description: 'Run ward and assert zero failures',
          }),
        }),
        DependencyStepStub({
          id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          focusFile: StepFileReferenceStub({
            path: 'src/guards/is-valid/is-valid-guard.ts',
          }),
        }),
      ];

      const result = questDuplicateStepFocusFilesTransformer({ steps });

      expect(result).toStrictEqual(['src/guards/is-valid/is-valid-guard.ts']);
    });
  });

  describe('empty', () => {
    it('EMPTY: {steps: undefined} => returns []', () => {
      const result = questDuplicateStepFocusFilesTransformer({});

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {steps: []} => returns []', () => {
      const result = questDuplicateStepFocusFilesTransformer({ steps: [] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {only focusAction steps} => returns []', () => {
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          focusFile: undefined,
          focusAction: StepFocusActionStub({
            kind: 'verification',
            description: 'Run ward and assert zero failures',
          }),
        }),
      ];

      const result = questDuplicateStepFocusFilesTransformer({ steps });

      expect(result).toStrictEqual([]);
    });
  });
});
