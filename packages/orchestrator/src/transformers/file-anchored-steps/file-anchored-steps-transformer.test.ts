import {
  DependencyStepStub,
  StepFileReferenceStub,
  StepFocusActionStub,
} from '@dungeonmaster/shared/contracts';

import { fileAnchoredStepsTransformer } from './file-anchored-steps-transformer';

describe('fileAnchoredStepsTransformer', () => {
  describe('filtering', () => {
    it('VALID: {all steps have focusFile} => returns all steps', () => {
      const stepA = DependencyStepStub({
        id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
        focusFile: StepFileReferenceStub({
          path: 'src/brokers/auth/login/auth-login-broker.ts',
        }),
      });
      const stepB = DependencyStepStub({
        id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
        focusFile: StepFileReferenceStub({
          path: 'src/guards/is-valid/is-valid-guard.ts',
        }),
      });

      const result = fileAnchoredStepsTransformer({ steps: [stepA, stepB] });

      expect(result).toStrictEqual([stepA, stepB]);
    });

    it('VALID: {mixed focusFile and focusAction} => returns only focusFile steps', () => {
      const fileStep = DependencyStepStub({
        id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
        focusFile: StepFileReferenceStub({
          path: 'src/brokers/auth/login/auth-login-broker.ts',
        }),
      });
      const actionStep = DependencyStepStub({
        id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
        focusFile: undefined,
        focusAction: StepFocusActionStub({
          kind: 'verification',
          description: 'Run ward and assert zero failures',
        }),
      });

      const result = fileAnchoredStepsTransformer({ steps: [fileStep, actionStep] });

      expect(result).toStrictEqual([fileStep]);
    });

    it('VALID: {all steps have focusAction only} => returns empty array', () => {
      const actionStepA = DependencyStepStub({
        id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
        focusFile: undefined,
        focusAction: StepFocusActionStub({
          kind: 'command',
          description: 'Run npm run build',
        }),
      });
      const actionStepB = DependencyStepStub({
        id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
        focusFile: undefined,
        focusAction: StepFocusActionStub({
          kind: 'sweep-check',
          description: 'Assert no remaining references',
        }),
      });

      const result = fileAnchoredStepsTransformer({ steps: [actionStepA, actionStepB] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {steps: []} => returns empty array', () => {
      const result = fileAnchoredStepsTransformer({ steps: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
