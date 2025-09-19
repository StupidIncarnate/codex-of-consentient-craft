import { eslintUtilLoadConfigByFile } from './eslint-util-load-config-by-file';
import { ESLint } from 'eslint';
import type { Linter } from 'eslint';

jest.mock('eslint');

describe('eslintUtilLoadConfigByFile', () => {
  const mockESLint = ESLint as jest.MockedClass<typeof ESLint>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test helpers
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

  describe('valid input', () => {
    it('VALID: {cwd: "/project", filePath: "test.ts"} => returns eslint config', async () => {
      const mockConfig: Linter.Config = {
        rules: { 'no-unused-vars': 'error' },
      };
      const mockInstance = createMockESLintWithConfig(mockConfig);

      const result = await eslintUtilLoadConfigByFile({
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

      const result = await eslintUtilLoadConfigByFile({
        filePath: 'test.ts',
      });

      expect(mockESLint).toHaveBeenCalledWith({ cwd: process.cwd() });
      expect(result).toStrictEqual(mockConfig);
    });

    it('VALID: same cwd called twice => returns cached config on second call', async () => {
      const mockConfig: Linter.Config = { rules: { 'no-undef': 'error' } };
      createMockESLintWithConfig(mockConfig);

      const result1 = await eslintUtilLoadConfigByFile({ cwd: '/test', filePath: 'file1.ts' });
      const result2 = await eslintUtilLoadConfigByFile({ cwd: '/test', filePath: 'file2.ts' });

      // Verify caching: ESLint constructor should only be called once
      expect(mockESLint).toHaveBeenCalledTimes(1);
      expect(result1).toStrictEqual(mockConfig);
      expect(result2).toStrictEqual(mockConfig);
    });

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

      const result1 = await eslintUtilLoadConfigByFile({ cwd: '/test1', filePath: 'file.ts' });
      const result2 = await eslintUtilLoadConfigByFile({ cwd: '/test2', filePath: 'file.ts' });

      // Verify cache isolation: different cwds should get different configs
      expect(mockESLint).toHaveBeenCalledTimes(2);
      expect(result1).toStrictEqual(mockConfig1);
      expect(result2).toStrictEqual(mockConfig2);
    });
  });

  describe('edge cases', () => {
    it('EDGE: calculateConfigForFile returns null => returns empty config', async () => {
      createMockESLintWithConfig(null);

      const result = await eslintUtilLoadConfigByFile({
        filePath: 'test.ts',
      });

      expect(result).toStrictEqual({});
    });
  });

  describe('error handling', () => {
    it('ERROR: ESLint constructor throws => throws formatted error', async () => {
      createErrorMockESLint(new Error('Permission denied'));

      await expect(
        eslintUtilLoadConfigByFile({
          cwd: getUniqueErrorTestCwd(),
          filePath: 'test.ts',
        }),
      ).rejects.toThrow('Failed to load ESLint configuration: Permission denied');
    });

    it('ERROR: calculateConfigForFile throws => throws formatted error', async () => {
      createMockESLintWithError(new Error('Invalid file path'));

      await expect(
        eslintUtilLoadConfigByFile({
          cwd: getUniqueErrorTestCwd(),
          filePath: 'invalid.ts',
        }),
      ).rejects.toThrow('Failed to load ESLint configuration: Invalid file path');
    });

    it('ERROR: non-Error thrown => throws formatted error with string conversion', async () => {
      createErrorMockESLint(new Error('Something went wrong'));

      await expect(
        eslintUtilLoadConfigByFile({
          cwd: getUniqueErrorTestCwd(),
          filePath: 'test.ts',
        }),
      ).rejects.toThrow('Failed to load ESLint configuration: Something went wrong');
    });
  });
});
