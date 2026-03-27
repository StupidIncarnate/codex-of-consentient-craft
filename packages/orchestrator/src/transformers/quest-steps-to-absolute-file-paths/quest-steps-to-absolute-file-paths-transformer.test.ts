import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { questStepsToAbsoluteFilePathsTransformer } from './quest-steps-to-absolute-file-paths-transformer';

describe('questStepsToAbsoluteFilePathsTransformer', () => {
  describe('steps with absolute file paths', () => {
    it('VALID: {single step with absolute focusFile} => returns absolute paths', () => {
      const steps = [
        DependencyStepStub({
          focusFile: {
            path: '/src/brokers/auth/login/auth-login-broker.ts',
            action: 'create',
          },
          accompanyingFiles: [],
        }),
      ];

      const result = questStepsToAbsoluteFilePathsTransformer({ steps });

      expect(result).toStrictEqual(['/src/brokers/auth/login/auth-login-broker.ts']);
    });

    it('VALID: {single step with focusFile and accompanyingFiles} => returns deduplicated paths', () => {
      const steps = [
        DependencyStepStub({
          focusFile: { path: '/src/brokers/auth/auth-broker.ts', action: 'create' },
          accompanyingFiles: [{ path: '/src/contracts/user/user-contract.ts', action: 'create' }],
        }),
      ];

      const result = questStepsToAbsoluteFilePathsTransformer({ steps });

      expect(result).toStrictEqual([
        '/src/brokers/auth/auth-broker.ts',
        '/src/contracts/user/user-contract.ts',
      ]);
    });

    it('VALID: {multiple steps} => returns deduplicated paths across all steps', () => {
      const steps = [
        DependencyStepStub({
          focusFile: { path: '/src/brokers/auth/auth-broker.ts', action: 'create' },
          accompanyingFiles: [],
        }),
        DependencyStepStub({
          focusFile: { path: '/src/contracts/token/token-contract.ts', action: 'create' },
          accompanyingFiles: [{ path: '/src/brokers/auth/auth-broker.ts', action: 'create' }],
        }),
      ];

      const result = questStepsToAbsoluteFilePathsTransformer({ steps });

      expect(result).toStrictEqual([
        '/src/brokers/auth/auth-broker.ts',
        '/src/contracts/token/token-contract.ts',
      ]);
    });
  });

  describe('empty steps', () => {
    it('EMPTY: {no steps} => returns empty array', () => {
      const result = questStepsToAbsoluteFilePathsTransformer({ steps: [] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {steps with non-absolute paths} => returns empty array', () => {
      const steps = [
        DependencyStepStub({
          focusFile: { path: 'src/file.ts', action: 'create' },
          accompanyingFiles: [],
        }),
      ];

      const result = questStepsToAbsoluteFilePathsTransformer({ steps });

      expect(result).toStrictEqual([]);
    });
  });

  describe('steps with relative paths', () => {
    it('EDGE: {steps with relative paths} => skips non-absolute paths', () => {
      const steps = [
        DependencyStepStub({
          focusFile: { path: 'src/file.ts', action: 'create' },
          accompanyingFiles: [{ path: './other/file.ts', action: 'create' }],
        }),
      ];

      const result = questStepsToAbsoluteFilePathsTransformer({ steps });

      expect(result).toStrictEqual([]);
    });
  });
});
