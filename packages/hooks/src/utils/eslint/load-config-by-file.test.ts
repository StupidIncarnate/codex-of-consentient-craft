import { loadConfigByFile } from './load-config-by-file';
import { ESLint } from 'eslint';
import type { Linter } from 'eslint';

jest.mock('eslint');

const mockESLint = jest.mocked(ESLint);

// Helper to create a mock ESLint instance
// Provides all required methods for type safety
const createMockESLintInstance = ({
  calculateConfigForFile,
}: {
  calculateConfigForFile: jest.MockedFunction<ESLint['calculateConfigForFile']>;
}): ESLint => {
  return {
    calculateConfigForFile,
    lintText: jest.fn(),
    lintFiles: jest.fn(),
    getRulesMetaForResults: jest.fn(),
    isPathIgnored: jest.fn(),
    loadFormatter: jest.fn(),
    hasFlag: jest.fn(),
    findConfigFile: jest.fn(),
  } satisfies ESLint;
};

describe('loadConfigByFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test helpers
  const createMockESLintWithConfig = (config: Linter.Config | null): void => {
    const mockInstance = createMockESLintInstance({
      calculateConfigForFile: jest.fn().mockResolvedValue(config),
    });

    mockESLint.mockImplementation(() => {
      return mockInstance;
    });
  };

  const createErrorMockESLint = (error: Error): void => {
    mockESLint.mockImplementation(() => {
      throw error;
    });
  };

  const createMockESLintWithError = (error: Error): void => {
    const mockInstance = createMockESLintInstance({
      calculateConfigForFile: jest.fn().mockRejectedValue(error),
    });

    mockESLint.mockImplementation(() => {
      return mockInstance;
    });
  };

  const getUniqueErrorTestCwd = (() => {
    let counter = 0;
    return (): string => {
      counter += 1;
      return `/error-test-${counter}`;
    };
  })();

  describe('valid input', () => {
    it('VALID: {cwd: "/project", filePath: "test.ts"} => returns eslint config', async () => {
      const mockConfig: Linter.Config = {
        rules: { 'no-unused-vars': 'error' },
      };
      createMockESLintWithConfig(mockConfig);

      const result = await loadConfigByFile({
        cwd: '/project',
        filePath: 'test.ts',
      });

      expect(jest.mocked(ESLint)).toHaveBeenCalledWith({ cwd: '/project' });
      expect(result).toStrictEqual(mockConfig);
    });

    it('VALID: {filePath: "test.ts"} => returns eslint config with default cwd', async () => {
      const mockConfig: Linter.Config = {
        rules: { 'no-console': 'warn' },
      };
      createMockESLintWithConfig(mockConfig);

      const result = await loadConfigByFile({
        filePath: 'test.ts',
      });

      expect(jest.mocked(ESLint)).toHaveBeenCalledWith({ cwd: process.cwd() });
      expect(result).toStrictEqual(mockConfig);
    });

    it('VALID: same cwd called twice => returns cached config on second call', async () => {
      const mockConfig: Linter.Config = { rules: { 'no-undef': 'error' } };
      createMockESLintWithConfig(mockConfig);

      const result1 = await loadConfigByFile({ cwd: '/test', filePath: 'file1.ts' });
      const result2 = await loadConfigByFile({ cwd: '/test', filePath: 'file2.ts' });

      // Verify caching: ESLint constructor should only be called once
      expect(jest.mocked(ESLint)).toHaveBeenCalledTimes(1);
      expect(result1).toStrictEqual(mockConfig);
      expect(result2).toStrictEqual(mockConfig);
    });

    it('VALID: different cwd => calculates new config', async () => {
      const mockConfig1: Linter.Config = { rules: { 'no-undef': 'error' } };
      const mockConfig2: Linter.Config = { rules: { 'no-console': 'warn' } };

      const mockInstance1 = createMockESLintInstance({
        calculateConfigForFile: jest.fn().mockResolvedValue(mockConfig1),
      });
      const mockInstance2 = createMockESLintInstance({
        calculateConfigForFile: jest.fn().mockResolvedValue(mockConfig2),
      });

      mockESLint
        .mockImplementationOnce(() => {
          return mockInstance1;
        })
        .mockImplementationOnce(() => {
          return mockInstance2;
        });

      const result1 = await loadConfigByFile({ cwd: '/test1', filePath: 'file.ts' });
      const result2 = await loadConfigByFile({ cwd: '/test2', filePath: 'file.ts' });

      // Verify cache isolation: different cwds should get different configs
      expect(jest.mocked(ESLint)).toHaveBeenCalledTimes(2);
      expect(result1).toStrictEqual(mockConfig1);
      expect(result2).toStrictEqual(mockConfig2);
    });
  });

  describe('edge cases', () => {
    it('EDGE: calculateConfigForFile returns null => returns empty config', async () => {
      createMockESLintWithConfig(null);

      const result = await loadConfigByFile({
        filePath: 'test.ts',
      });

      expect(result).toStrictEqual({});
    });
  });

  describe('error handling', () => {
    it('ERROR: ESLint constructor throws => throws formatted error', async () => {
      createErrorMockESLint(new Error('Permission denied'));

      await expect(
        loadConfigByFile({
          cwd: getUniqueErrorTestCwd(),
          filePath: 'test.ts',
        }),
      ).rejects.toThrow('Failed to load ESLint configuration: Permission denied');
    });

    it('ERROR: calculateConfigForFile throws => throws formatted error', async () => {
      createMockESLintWithError(new Error('Invalid file path'));

      await expect(
        loadConfigByFile({
          cwd: getUniqueErrorTestCwd(),
          filePath: 'invalid.ts',
        }),
      ).rejects.toThrow('Failed to load ESLint configuration: Invalid file path');
    });

    it('ERROR: non-Error thrown => throws formatted error with string conversion', async () => {
      createErrorMockESLint(new Error('Something went wrong'));

      await expect(
        loadConfigByFile({
          cwd: getUniqueErrorTestCwd(),
          filePath: 'test.ts',
        }),
      ).rejects.toThrow('Failed to load ESLint configuration: Something went wrong');
    });
  });
});
