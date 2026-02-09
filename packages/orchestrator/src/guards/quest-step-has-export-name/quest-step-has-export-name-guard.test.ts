import { DependencyStepStub } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import { questStepHasExportNameGuard } from './quest-step-has-export-name-guard';

describe('questStepHasExportNameGuard', () => {
  describe('valid steps', () => {
    it('VALID: {empty steps array} => returns true', () => {
      const result = questStepHasExportNameGuard({ steps: [], folderConfigs: folderConfigStatics });

      expect(result).toBe(true);
    });

    it('VALID: {step with entry file and exportName set} => returns true', () => {
      const steps = [
        DependencyStepStub({
          filesToCreate: ['src/brokers/auth/login/auth-login-broker.ts'],
          exportName: 'authLoginBroker',
        }),
      ];

      const result = questStepHasExportNameGuard({ steps, folderConfigs: folderConfigStatics });

      expect(result).toBe(true);
    });

    it('VALID: {step with empty filesToCreate} => returns true', () => {
      const steps = [
        DependencyStepStub({
          filesToCreate: [],
        }),
      ];

      const result = questStepHasExportNameGuard({ steps, folderConfigs: folderConfigStatics });

      expect(result).toBe(true);
    });

    it('VALID: {step with only non-entry files in filesToCreate} => returns true', () => {
      const steps = [
        DependencyStepStub({
          filesToCreate: [
            'src/brokers/auth/login/validate-helper.ts',
            'src/brokers/auth/login/auth-login-broker.test.ts',
          ],
        }),
      ];

      const result = questStepHasExportNameGuard({ steps, folderConfigs: folderConfigStatics });

      expect(result).toBe(true);
    });
  });

  describe('invalid steps', () => {
    it('INVALID_EXPORT: {step with entry file but no exportName} => returns false', () => {
      const steps = [
        DependencyStepStub({
          filesToCreate: ['src/guards/is-valid/is-valid-guard.ts'],
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
          filesToCreate: ['src/brokers/auth/login/auth-login-broker.ts'],
          exportName: 'authLoginBroker',
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          filesToCreate: ['src/brokers/auth/login/some-utility.ts'],
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
          filesToCreate: ['src/brokers/auth/login/auth-login-broker.ts'],
          exportName: 'authLoginBroker',
        }),
      ];

      const result = questStepHasExportNameGuard({ steps });

      expect(result).toBe(false);
    });
  });
});
