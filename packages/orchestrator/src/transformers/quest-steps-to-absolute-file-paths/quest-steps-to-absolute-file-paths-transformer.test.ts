import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { questStepsToAbsoluteFilePathsTransformer } from './quest-steps-to-absolute-file-paths-transformer';

describe('questStepsToAbsoluteFilePathsTransformer', () => {
  describe('steps with absolute file paths', () => {
    it('VALID: {single step with filesToCreate} => returns absolute paths', () => {
      const steps = [
        DependencyStepStub({
          filesToCreate: ['/src/brokers/auth/login/auth-login-broker.ts'],
          filesToModify: [],
        }),
      ];

      const result = questStepsToAbsoluteFilePathsTransformer({ steps });

      expect(result).toStrictEqual(['/src/brokers/auth/login/auth-login-broker.ts']);
    });

    it('VALID: {single step with filesToCreate and filesToModify} => returns deduplicated paths', () => {
      const steps = [
        DependencyStepStub({
          filesToCreate: ['/src/brokers/auth/auth-broker.ts'],
          filesToModify: ['/src/contracts/user/user-contract.ts'],
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
          filesToCreate: ['/src/brokers/auth/auth-broker.ts'],
          filesToModify: [],
        }),
        DependencyStepStub({
          filesToCreate: ['/src/contracts/token/token-contract.ts'],
          filesToModify: ['/src/brokers/auth/auth-broker.ts'],
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

    it('EMPTY: {steps with no files} => returns empty array', () => {
      const steps = [
        DependencyStepStub({
          filesToCreate: [],
          filesToModify: [],
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
          filesToCreate: ['src/file.ts'],
          filesToModify: ['./other/file.ts'],
        }),
      ];

      const result = questStepsToAbsoluteFilePathsTransformer({ steps });

      expect(result).toStrictEqual([]);
    });
  });
});
