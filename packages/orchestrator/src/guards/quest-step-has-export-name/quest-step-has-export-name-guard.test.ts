import {
  DependencyStepStub,
  StepFileReferenceStub,
  StepFocusActionStub,
} from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import { questStepHasExportNameGuard } from './quest-step-has-export-name-guard';

describe('questStepHasExportNameGuard', () => {
  describe('valid steps', () => {
    it('VALID: {empty steps array} => returns true', () => {
      const result = questStepHasExportNameGuard({ steps: [], folderConfigs: folderConfigStatics });

      expect(result).toBe(true);
    });

    it('VALID: {step with entry focusFile and exportName set} => returns true', () => {
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'src/brokers/auth/login/auth-login-broker.ts',
          }),
          exportName: 'authLoginBroker',
        }),
      ];

      const result = questStepHasExportNameGuard({ steps, folderConfigs: folderConfigStatics });

      expect(result).toBe(true);
    });

    it('VALID: {step with non-entry focusFile} => returns true', () => {
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'src/brokers/auth/login/validate-helper.ts',
          }),
        }),
      ];

      const result = questStepHasExportNameGuard({ steps, folderConfigs: folderConfigStatics });

      expect(result).toBe(true);
    });
  });

  describe('invalid steps', () => {
    it('INVALID: {step with entry focusFile but no exportName} => returns false', () => {
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'src/guards/is-valid/is-valid-guard.ts',
          }),
        }),
      ];

      const result = questStepHasExportNameGuard({ steps, folderConfigs: folderConfigStatics });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {mix of steps, entry file step has exportName, non-entry file step does not} => returns true', () => {
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          focusFile: StepFileReferenceStub({
            path: 'src/brokers/auth/login/auth-login-broker.ts',
          }),
          exportName: 'authLoginBroker',
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          focusFile: StepFileReferenceStub({
            path: 'src/brokers/auth/login/some-utility.ts',
          }),
        }),
      ];

      const result = questStepHasExportNameGuard({ steps, folderConfigs: folderConfigStatics });

      expect(result).toBe(true);
    });

    it('VALID: {mixed steps with focusAction-only step} => focusAction step filtered, file-anchored step drives outcome', () => {
      const steps = [
        DependencyStepStub({
          id: 'file-anchored-broker',
          focusFile: StepFileReferenceStub({
            path: 'src/brokers/auth/login/auth-login-broker.ts',
          }),
          exportName: 'authLoginBroker',
        }),
        DependencyStepStub({
          id: 'focus-action-verification',
          focusFile: undefined,
          focusAction: StepFocusActionStub({
            kind: 'verification',
            description: 'Run ward and assert zero failures',
          }),
        }),
      ];

      const result = questStepHasExportNameGuard({ steps, folderConfigs: folderConfigStatics });

      expect(result).toBe(true);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {steps: undefined} => returns false', () => {
      const result = questStepHasExportNameGuard({ folderConfigs: folderConfigStatics });

      expect(result).toBe(false);
    });

    it('EMPTY: {folderConfigs: undefined} => returns false', () => {
      const steps = [
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: 'src/brokers/auth/login/auth-login-broker.ts',
          }),
          exportName: 'authLoginBroker',
        }),
      ];

      const result = questStepHasExportNameGuard({ steps });

      expect(result).toBe(false);
    });
  });
});
