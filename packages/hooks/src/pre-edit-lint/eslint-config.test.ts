import { ESLint } from 'eslint';
import type { Linter } from 'eslint';
import { EslintConfig } from './eslint-config';
import { HookConfigLoader } from '../utils/hook-config-loader';

jest.mock('eslint');
jest.mock('../utils/hook-config-loader');

const mockESLint = ESLint as jest.MockedClass<typeof ESLint>;
const mockHookConfigLoader = HookConfigLoader as jest.Mocked<typeof HookConfigLoader>;

// Test helpers
const mockHookConfigLoaderWithRules = (rules: string[]) => {
  mockHookConfigLoader.getRuleNames.mockReturnValue(rules);
};

const createMockESLintWithConfig = (config: Linter.Config | null) => {
  const mockInstance = {
    calculateConfigForFile: jest.fn().mockResolvedValue(config),
  };
  mockESLint.mockImplementation(() => mockInstance as unknown as ESLint);
  return mockInstance;
};

const createErrorMockESLint = (error: Error) => {
  mockESLint.mockImplementation(() => {
    throw error;
  });
};

const createMockESLintWithError = (error: Error) => {
  const mockInstance = {
    calculateConfigForFile: jest.fn().mockRejectedValue(error),
  };
  mockESLint.mockImplementation(() => mockInstance as unknown as ESLint);
  return mockInstance;
};

const getUniqueErrorTestCwd = (() => {
  let counter = 0;
  return () => `/error-test-${++counter}`;
})();

describe('EslintConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadConfigByFile()', () => {
    it('VALID: {cwd: "/project", filePath: "test.ts"} => returns eslint config', async () => {
      const mockConfig: Linter.Config = {
        rules: { 'no-unused-vars': 'error' },
      };
      const mockInstance = createMockESLintWithConfig(mockConfig);

      const result = await EslintConfig.loadConfigByFile({
        cwd: '/project',
        filePath: 'test.ts',
      });

      expect(mockESLint).toHaveBeenCalledWith({ cwd: '/project' });
      expect(mockInstance.calculateConfigForFile).toHaveBeenCalledWith('test.ts');
      expect(result).toStrictEqual(mockConfig);
    });

    it('VALID: {filePath: "test.ts"} => returns eslint config with default cwd', async () => {
      const mockConfig: Linter.Config = {
        rules: { 'no-console': 'warn' },
      };
      createMockESLintWithConfig(mockConfig);

      const result = await EslintConfig.loadConfigByFile({
        filePath: 'test.ts',
      });

      expect(mockESLint).toHaveBeenCalledWith({ cwd: process.cwd() });
      expect(result).toStrictEqual(mockConfig);
    });

    // Performance test: ensures caching optimization works
    it('VALID: same cwd called twice => returns cached config on second call', async () => {
      const mockConfig: Linter.Config = { rules: { 'no-undef': 'error' } };
      createMockESLintWithConfig(mockConfig);

      const result1 = await EslintConfig.loadConfigByFile({ cwd: '/test', filePath: 'file1.ts' });
      const result2 = await EslintConfig.loadConfigByFile({ cwd: '/test', filePath: 'file2.ts' });

      // Verify caching: ESLint constructor should only be called once
      expect(mockESLint).toHaveBeenCalledTimes(1);
      expect(result1).toStrictEqual(mockConfig);
      expect(result2).toStrictEqual(mockConfig);
    });

    // Correctness test: ensures cache isolation per cwd
    it('VALID: different cwd => calculates new config', async () => {
      const mockConfig1: Linter.Config = { rules: { 'no-undef': 'error' } };
      const mockConfig2: Linter.Config = { rules: { 'no-console': 'warn' } };

      mockESLint
        .mockImplementationOnce(
          () =>
            ({
              calculateConfigForFile: jest.fn().mockResolvedValue(mockConfig1),
            }) as unknown as ESLint,
        )
        .mockImplementationOnce(
          () =>
            ({
              calculateConfigForFile: jest.fn().mockResolvedValue(mockConfig2),
            }) as unknown as ESLint,
        );

      const result1 = await EslintConfig.loadConfigByFile({ cwd: '/test1', filePath: 'file.ts' });
      const result2 = await EslintConfig.loadConfigByFile({ cwd: '/test2', filePath: 'file.ts' });

      // Verify cache isolation: different cwds should get different configs
      expect(mockESLint).toHaveBeenCalledTimes(2);
      expect(result1).toStrictEqual(mockConfig1);
      expect(result2).toStrictEqual(mockConfig2);
    });

    it('EDGE: calculateConfigForFile returns null => returns empty config', async () => {
      createMockESLintWithConfig(null);

      const result = await EslintConfig.loadConfigByFile({
        filePath: 'test.ts',
      });

      expect(result).toStrictEqual({});
    });

    it('ERROR: ESLint constructor throws => throws formatted error', async () => {
      createErrorMockESLint(new Error('Permission denied'));

      await expect(
        EslintConfig.loadConfigByFile({
          cwd: getUniqueErrorTestCwd(),
          filePath: 'test.ts',
        }),
      ).rejects.toThrow('Failed to load ESLint configuration: Permission denied');
    });

    it('ERROR: calculateConfigForFile throws => throws formatted error', async () => {
      createMockESLintWithError(new Error('Invalid file path'));

      await expect(
        EslintConfig.loadConfigByFile({
          cwd: getUniqueErrorTestCwd(),
          filePath: 'invalid.ts',
        }),
      ).rejects.toThrow('Failed to load ESLint configuration: Invalid file path');
    });

    it('ERROR: non-Error thrown => throws formatted error with string conversion', async () => {
      createErrorMockESLint(new Error('Something went wrong'));

      await expect(
        EslintConfig.loadConfigByFile({
          cwd: getUniqueErrorTestCwd(),
          filePath: 'test.ts',
        }),
      ).rejects.toThrow('Failed to load ESLint configuration: Something went wrong');
    });
  });

  describe('createFilteredConfig()', () => {
    it('VALID: {eslintConfig with rules, hookConfig} => returns filtered config', () => {
      mockHookConfigLoaderWithRules(['no-unused-vars', 'no-console']);

      const eslintConfig: Linter.Config = {
        rules: {
          'no-unused-vars': 'error',
          'no-console': 'warn',
          'prefer-const': 'error',
        },
      };
      const hookConfig = {
        rules: ['no-unused-vars', 'no-console'],
      };

      const result = EslintConfig.createFilteredConfig({
        eslintConfig,
        hookConfig,
      });

      expect(result).toStrictEqual({
        rules: {
          'no-unused-vars': 'error',
          'no-console': 'warn',
        },
        files: ['**/*.ts', '**/*.tsx'],
      });
    });

    it('VALID: {eslintConfig with matching rules, hookConfig} => includes matching rules only', () => {
      mockHookConfigLoaderWithRules(['no-unused-vars']);

      const eslintConfig: Linter.Config = {
        rules: {
          'no-unused-vars': 'error',
          'prefer-const': 'error',
          'no-var': 'error',
        },
      };
      const hookConfig = {
        rules: ['no-unused-vars'],
      };

      const result = EslintConfig.createFilteredConfig({
        eslintConfig,
        hookConfig,
      });

      expect(result).toStrictEqual({
        rules: {
          'no-unused-vars': 'error',
        },
        files: ['**/*.ts', '**/*.tsx'],
      });
    });

    it('VALID: {eslintConfig with language property, hookConfig} => removes language property', () => {
      mockHookConfigLoaderWithRules(['no-unused-vars']);

      const eslintConfig: Linter.Config = {
        rules: { 'no-unused-vars': 'error' },
        language: 'typescript',
      };
      const hookConfig = {
        rules: ['no-unused-vars'],
      };

      const result = EslintConfig.createFilteredConfig({
        eslintConfig,
        hookConfig,
      });

      expect(result).toStrictEqual({
        rules: { 'no-unused-vars': 'error' },
        files: ['**/*.ts', '**/*.tsx'],
      });
    });

    it('EDGE: {eslintConfig without rules, hookConfig} => returns config with empty rules', () => {
      mockHookConfigLoaderWithRules(['no-unused-vars']);

      const eslintConfig: Linter.Config = {};
      const hookConfig = {
        rules: ['no-unused-vars'],
      };

      const result = EslintConfig.createFilteredConfig({
        eslintConfig,
        hookConfig,
      });

      expect(result).toStrictEqual({
        rules: {},
        files: ['**/*.ts', '**/*.tsx'],
      });
    });

    it('EDGE: {eslintConfig with rules, hookConfig with no matching rules} => returns config with empty rules', () => {
      mockHookConfigLoaderWithRules(['prefer-const']);

      const eslintConfig: Linter.Config = {
        rules: {
          'no-unused-vars': 'error',
          'no-console': 'warn',
        },
      };
      const hookConfig = {
        rules: ['prefer-const'],
      };

      const result = EslintConfig.createFilteredConfig({
        eslintConfig,
        hookConfig,
      });

      expect(result).toStrictEqual({
        rules: {},
        files: ['**/*.ts', '**/*.tsx'],
      });
    });

    it('EDGE: {eslintConfig with undefined rules property, hookConfig} => returns config with empty rules', () => {
      mockHookConfigLoaderWithRules(['no-unused-vars']);

      const eslintConfig: Linter.Config = {
        rules: undefined,
      };
      const hookConfig = {
        rules: ['no-unused-vars'],
      };

      const result = EslintConfig.createFilteredConfig({
        eslintConfig,
        hookConfig,
      });

      expect(result).toStrictEqual({
        rules: {},
        files: ['**/*.ts', '**/*.tsx'],
      });
    });
  });
});
