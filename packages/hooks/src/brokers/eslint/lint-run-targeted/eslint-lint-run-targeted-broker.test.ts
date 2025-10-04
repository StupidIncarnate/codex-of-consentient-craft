import { ESLint } from 'eslint';
import type { Linter } from 'eslint';
import { eslintLintRunTargetedBroker } from './eslint-lint-run-targeted-broker';

jest.mock('eslint');

const mockESLint = jest.mocked(ESLint);

// Helper to create a mock ESLint instance
// Provides all required methods, but only lintText is actually used in tests
const createMockESLintInstance = ({
  lintText,
}: {
  lintText: jest.MockedFunction<ESLint['lintText']>;
}): ESLint => {
  return {
    lintText,
    lintFiles: jest.fn(),
    getRulesMetaForResults: jest.fn(),
    calculateConfigForFile: jest.fn(),
    isPathIgnored: jest.fn(),
    loadFormatter: jest.fn(),
    hasFlag: jest.fn(),
    findConfigFile: jest.fn(),
  } satisfies ESLint;
};

describe('eslintLintRunTargetedBroker()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('valid input', () => {
    it('VALID: {content: "const x = 1;", filePath: "test.ts", config: {}} => returns transformed results', async () => {
      const mockLintText = jest.fn().mockResolvedValue([
        {
          filePath: '/home/test/test.ts',
          messages: [
            {
              line: 1,
              column: 7,
              message: 'Prefer const assertions',
              severity: 1,
              ruleId: 'prefer-const',
            },
          ],
          errorCount: 0,
          warningCount: 1,
        },
      ]);

      const mockESLintInstance = createMockESLintInstance({ lintText: mockLintText });
      mockESLint.mockImplementation(() => {
        return mockESLintInstance;
      });

      const config: Linter.Config = { rules: { 'prefer-const': 'warn' } };
      const results = await eslintLintRunTargetedBroker({
        content: 'const x = 1;',
        filePath: 'test.ts',
        config,
      });

      expect(results).toStrictEqual([
        {
          filePath: '/home/test/test.ts',
          messages: [
            {
              line: 1,
              column: 7,
              message: 'Prefer const assertions',
              severity: 1,
              ruleId: 'prefer-const',
            },
          ],
          errorCount: 0,
          warningCount: 1,
        },
      ]);
    });

    it('VALID: {content: "const x = 1;", filePath: "test.ts", config: {}, cwd: "/custom"} => returns results with custom cwd', async () => {
      const mockLintText = jest.fn().mockResolvedValue([
        {
          filePath: '/custom/test.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);

      const mockESLintInstance = createMockESLintInstance({ lintText: mockLintText });
      mockESLint.mockImplementation(() => {
        return mockESLintInstance;
      });

      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: 'const x = 1;',
        filePath: 'test.ts',
        config,
        cwd: '/custom',
      });

      expect(mockESLint).toHaveBeenCalledWith({
        cwd: '/custom',
        overrideConfigFile: true,
        overrideConfig: [config],
      });

      expect(results).toStrictEqual([
        {
          filePath: '/custom/test.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);
    });

    it('VALID: {content: "const x = 1;", filePath: "relative/path.ts", config: {}} => converts to absolute path', async () => {
      const mockLintText = jest.fn().mockResolvedValue([
        {
          filePath: '/home/test/relative/path.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);

      const mockESLintInstance = createMockESLintInstance({ lintText: mockLintText });
      mockESLint.mockImplementation(() => {
        return mockESLintInstance;
      });

      const config: Linter.Config = {};
      await eslintLintRunTargetedBroker({
        content: 'const x = 1;',
        filePath: 'relative/path.ts',
        config,
      });

      expect(mockLintText).toHaveBeenCalledWith('const x = 1;', {
        filePath: `${process.cwd()}/relative/path.ts`,
      });
    });
  });

  describe('empty content handling', () => {
    it('EMPTY: {content: "", filePath: "test.ts", config: {}} => returns empty array', async () => {
      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: '',
        filePath: 'test.ts',
        config,
      });

      expect(results).toStrictEqual([]);
      expect(mockESLint).not.toHaveBeenCalled();
    });

    it('EMPTY: {content: "   ", filePath: "test.ts", config: {}} => returns empty array', async () => {
      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: '   ',
        filePath: 'test.ts',
        config,
      });

      expect(results).toStrictEqual([]);
      expect(mockESLint).not.toHaveBeenCalled();
    });

    it('EMPTY: {content: "\\n\\t  \\n", filePath: "test.ts", config: {}} => returns empty array', async () => {
      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: '\n\t  \n',
        filePath: 'test.ts',
        config,
      });

      expect(results).toStrictEqual([]);
      expect(mockESLint).not.toHaveBeenCalled();
    });
  });

  describe('eslint integration', () => {
    it('VALID: {content: "code", filePath: "test.ts", config: basicConfig} => creates ESLint with correct options', async () => {
      const mockLintText = jest.fn().mockResolvedValue([
        {
          filePath: '/test/basic.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);

      const mockESLintInstance = createMockESLintInstance({ lintText: mockLintText });
      mockESLint.mockImplementation(() => {
        return mockESLintInstance;
      });

      const config: Linter.Config = {
        rules: {
          'prefer-const': 'warn',
          'no-var': 'error',
        },
      };

      await eslintLintRunTargetedBroker({
        content: 'const x = 1;',
        filePath: 'test.ts',
        config,
      });

      expect(mockESLint).toHaveBeenCalledTimes(1);
      expect(mockESLint).toHaveBeenCalledWith({
        cwd: process.cwd(),
        overrideConfigFile: true,
        overrideConfig: [config],
      });
    });

    it('VALID: {content: "code", filePath: "test.ts", config: complexConfig} => passes complete config to ESLint', async () => {
      const mockLintText = jest.fn().mockResolvedValue([
        {
          filePath: '/test/complex.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);

      const mockESLintInstance = createMockESLintInstance({ lintText: mockLintText });
      mockESLint.mockImplementation(() => {
        return mockESLintInstance;
      });

      const config: Linter.Config = {
        rules: {
          'prefer-const': 'warn',
          '@typescript-eslint/no-explicit-any': 'error',
          '@typescript-eslint/explicit-function-return-type': 'warn',
        },
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
          parserOptions: {
            ecmaFeatures: {
              jsx: true,
            },
          },
        },
        settings: {
          'import/resolver': {
            typescript: {},
          },
        },
      };

      await eslintLintRunTargetedBroker({
        content: 'function test() { return 42; }',
        filePath: 'test.ts',
        config,
      });

      expect(mockESLint).toHaveBeenCalledTimes(1);
      expect(mockESLint).toHaveBeenCalledWith({
        cwd: process.cwd(),
        overrideConfigFile: true,
        overrideConfig: [config],
      });
    });

    it('VALID: {content: "code", filePath: "test.ts", config: {}} => calls lintText with absolute path', async () => {
      const mockLintText = jest.fn().mockResolvedValue([
        {
          filePath: '/test/absolute.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);

      const mockESLintInstance = createMockESLintInstance({ lintText: mockLintText });
      mockESLint.mockImplementation(() => {
        return mockESLintInstance;
      });

      const config: Linter.Config = {};
      await eslintLintRunTargetedBroker({
        content: 'const testCode = "hello";',
        filePath: 'test.ts',
        config,
      });

      expect(mockLintText).toHaveBeenCalledTimes(1);
      expect(mockLintText).toHaveBeenCalledWith('const testCode = "hello";', {
        filePath: `${process.cwd()}/test.ts`,
      });
    });
  });

  describe('result transformation', () => {
    it('VALID: {eslint result with messages} => transforms to LintResult format', async () => {
      const mockLintText = jest.fn().mockResolvedValue([
        {
          filePath: '/test/file.ts',
          messages: [
            {
              line: 5,
              column: 10,
              message: 'Missing semicolon',
              severity: 2,
              ruleId: 'semi',
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      ]);

      const mockESLintInstance = createMockESLintInstance({ lintText: mockLintText });
      mockESLint.mockImplementation(() => {
        return mockESLintInstance;
      });

      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: 'const x = 1',
        filePath: 'file.ts',
        config,
      });

      expect(results).toStrictEqual([
        {
          filePath: '/test/file.ts',
          messages: [
            {
              line: 5,
              column: 10,
              message: 'Missing semicolon',
              severity: 2,
              ruleId: 'semi',
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      ]);
    });

    it('VALID: {eslint result with multiple messages} => transforms all messages correctly', async () => {
      const mockLintText = jest.fn().mockResolvedValue([
        {
          filePath: '/test/multi.ts',
          messages: [
            {
              line: 1,
              column: 5,
              message: 'Unexpected any',
              severity: 2,
              ruleId: '@typescript-eslint/no-explicit-any',
            },
            {
              line: 3,
              column: 15,
              message: 'Prefer const assertion',
              severity: 1,
              ruleId: 'prefer-const',
            },
            {
              line: 5,
              column: 20,
              message: 'Missing return type',
              severity: 2,
              ruleId: '@typescript-eslint/explicit-function-return-type',
            },
          ],
          errorCount: 2,
          warningCount: 1,
        },
      ]);

      const mockESLintInstance = createMockESLintInstance({ lintText: mockLintText });
      mockESLint.mockImplementation(() => {
        return mockESLintInstance;
      });

      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: 'any x; let y = 1; function f() {}',
        filePath: 'multi.ts',
        config,
      });

      expect(results).toStrictEqual([
        {
          filePath: '/test/multi.ts',
          messages: [
            {
              line: 1,
              column: 5,
              message: 'Unexpected any',
              severity: 2,
              ruleId: '@typescript-eslint/no-explicit-any',
            },
            {
              line: 3,
              column: 15,
              message: 'Prefer const assertion',
              severity: 1,
              ruleId: 'prefer-const',
            },
            {
              line: 5,
              column: 20,
              message: 'Missing return type',
              severity: 2,
              ruleId: '@typescript-eslint/explicit-function-return-type',
            },
          ],
          errorCount: 2,
          warningCount: 1,
        },
      ]);
    });

    it('VALID: {eslint result with warnings and errors} => preserves counts correctly', async () => {
      const mockLintText = jest.fn().mockResolvedValue([
        {
          filePath: '/test/counts.ts',
          messages: [
            {
              line: 1,
              column: 1,
              message: 'Error message',
              severity: 2,
              ruleId: 'error-rule',
            },
            {
              line: 2,
              column: 1,
              message: 'Warning message',
              severity: 1,
              ruleId: 'warn-rule',
            },
          ],
          errorCount: 3,
          warningCount: 5,
        },
      ]);

      const mockESLintInstance = createMockESLintInstance({ lintText: mockLintText });
      mockESLint.mockImplementation(() => {
        return mockESLintInstance;
      });

      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: 'code with issues',
        filePath: 'counts.ts',
        config,
      });

      expect(results).toStrictEqual([
        {
          filePath: '/test/counts.ts',
          messages: [
            {
              line: 1,
              column: 1,
              message: 'Error message',
              severity: 2,
              ruleId: 'error-rule',
            },
            {
              line: 2,
              column: 1,
              message: 'Warning message',
              severity: 1,
              ruleId: 'warn-rule',
            },
          ],
          errorCount: 3,
          warningCount: 5,
        },
      ]);
    });

    it('VALID: {eslint result with undefined ruleId} => handles undefined ruleId', async () => {
      const mockLintText = jest.fn().mockResolvedValue([
        {
          filePath: '/test/norule.ts',
          messages: [
            {
              line: 1,
              column: 1,
              message: 'Syntax error',
              severity: 2,
              ruleId: null,
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      ]);

      const mockESLintInstance = createMockESLintInstance({ lintText: mockLintText });
      mockESLint.mockImplementation(() => {
        return mockESLintInstance;
      });

      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: 'syntax error code',
        filePath: 'norule.ts',
        config,
      });

      expect(results).toStrictEqual([
        {
          filePath: '/test/norule.ts',
          messages: [
            {
              line: 1,
              column: 1,
              message: 'Syntax error',
              severity: 2,
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      ]);
    });
  });

  describe('typescript project fallback', () => {
    it('EDGE: {result with TSConfig parsing error} => retries without project reference', async () => {
      const mockLintTextFirst = jest.fn().mockResolvedValueOnce([
        {
          filePath: '/test/project.ts',
          messages: [
            {
              line: 1,
              column: 1,
              message:
                'parserOptions.project has been set for @typescript-eslint/parser. TSConfig does not include this file',
              severity: 2,
              ruleId: null,
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      ]);

      const mockLintTextSecond = jest.fn().mockResolvedValueOnce([
        {
          filePath: '/test/project.ts',
          messages: [
            {
              line: 2,
              column: 5,
              message: 'Missing semicolon',
              severity: 2,
              ruleId: 'semi',
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      ]);

      mockESLint
        .mockImplementationOnce(() => {
          return createMockESLintInstance({ lintText: mockLintTextFirst });
        })
        .mockImplementationOnce(() => {
          return createMockESLintInstance({ lintText: mockLintTextSecond });
        });

      const config: Linter.Config = {
        languageOptions: {
          parserOptions: {
            project: './tsconfig.json',
          },
        },
      };

      const results = await eslintLintRunTargetedBroker({
        content: 'const x = 1',
        filePath: 'project.ts',
        config,
      });

      expect(mockESLint).toHaveBeenCalledTimes(2);
      expect(results).toStrictEqual([
        {
          filePath: '/test/project.ts',
          messages: [
            {
              line: 2,
              column: 5,
              message: 'Missing semicolon',
              severity: 2,
              ruleId: 'semi',
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      ]);
    });

    it('EDGE: {result with parserOptions.project error} => creates simplified config', async () => {
      const mockLintTextFirst = jest.fn().mockResolvedValueOnce([
        {
          filePath: '/test/config.ts',
          messages: [
            {
              line: 1,
              column: 1,
              message:
                'parserOptions.project has been set for @typescript-eslint/parser. TSConfig does not include this file',
              severity: 2,
              ruleId: null,
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      ]);

      const mockLintTextSecond = jest.fn().mockResolvedValueOnce([
        {
          filePath: '/test/config.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);

      mockESLint
        .mockImplementationOnce(() => {
          return createMockESLintInstance({ lintText: mockLintTextFirst });
        })
        .mockImplementationOnce(() => {
          return createMockESLintInstance({ lintText: mockLintTextSecond });
        });

      const config: Linter.Config = {
        languageOptions: {
          parserOptions: {
            project: './tsconfig.json',
            ecmaVersion: 2022,
          },
        },
      };

      const results = await eslintLintRunTargetedBroker({
        content: 'const valid = true;',
        filePath: 'config.ts',
        config,
      });

      expect(mockESLint).toHaveBeenCalledTimes(2);
      expect(mockESLint).toHaveBeenNthCalledWith(1, {
        cwd: process.cwd(),
        overrideConfigFile: true,
        overrideConfig: [config],
      });
      expect(mockESLint).toHaveBeenNthCalledWith(2, {
        cwd: process.cwd(),
        overrideConfigFile: true,
        overrideConfig: [
          {
            ...config,
            languageOptions: {
              ...config.languageOptions,
              parserOptions: {
                ecmaVersion: 2022,
              },
            },
          },
        ],
      });
      expect(results).toStrictEqual([
        {
          filePath: '/test/config.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);
    });

    it('EDGE: {result with "TSConfig does not include" error} => uses fallback ESLint instance', async () => {
      const mockLintTextFirst = jest.fn().mockResolvedValueOnce([
        {
          filePath: '/test/include.ts',
          messages: [
            {
              line: 1,
              column: 1,
              message:
                'parserOptions.project has been set for @typescript-eslint/parser. TSConfig does not include this file',
              severity: 2,
              ruleId: null,
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      ]);

      const mockLintTextSecond = jest.fn().mockResolvedValueOnce([
        {
          filePath: '/test/include.ts',
          messages: [
            {
              line: 1,
              column: 10,
              message: 'Valid code processed',
              severity: 1,
              ruleId: 'info',
            },
          ],
          errorCount: 0,
          warningCount: 1,
        },
      ]);

      mockESLint
        .mockImplementationOnce(() => {
          return createMockESLintInstance({ lintText: mockLintTextFirst });
        })
        .mockImplementationOnce(() => {
          return createMockESLintInstance({ lintText: mockLintTextSecond });
        });

      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: 'const included = true;',
        filePath: 'include.ts',
        config,
      });

      expect(mockESLint).toHaveBeenCalledTimes(2);
      expect(results).toStrictEqual([
        {
          filePath: '/test/include.ts',
          messages: [
            {
              line: 1,
              column: 10,
              message: 'Valid code processed',
              severity: 1,
              ruleId: 'info',
            },
          ],
          errorCount: 0,
          warningCount: 1,
        },
      ]);
    });

    it('VALID: {fallback succeeds} => returns fallback results', async () => {
      const mockLintTextFirst = jest.fn().mockResolvedValueOnce([
        {
          filePath: '/test/fallback.ts',
          messages: [
            {
              line: 1,
              column: 1,
              message:
                'parserOptions.project has been set for @typescript-eslint/parser. TSConfig does not include this file',
              severity: 2,
              ruleId: null,
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      ]);

      const mockLintTextSecond = jest.fn().mockResolvedValueOnce([
        {
          filePath: '/test/fallback.ts',
          messages: [
            {
              line: 3,
              column: 8,
              message: 'Fallback lint result',
              severity: 1,
              ruleId: 'fallback-rule',
            },
          ],
          errorCount: 0,
          warningCount: 1,
        },
      ]);

      mockESLint
        .mockImplementationOnce(() => {
          return createMockESLintInstance({ lintText: mockLintTextFirst });
        })
        .mockImplementationOnce(() => {
          return createMockESLintInstance({ lintText: mockLintTextSecond });
        });

      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: 'fallback code',
        filePath: 'fallback.ts',
        config,
      });

      expect(results).toStrictEqual([
        {
          filePath: '/test/fallback.ts',
          messages: [
            {
              line: 3,
              column: 8,
              message: 'Fallback lint result',
              severity: 1,
              ruleId: 'fallback-rule',
            },
          ],
          errorCount: 0,
          warningCount: 1,
        },
      ]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {ESLint constructor throws} => logs error and returns empty array', async () => {
      const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => {
        return true;
      });

      mockESLint.mockImplementation(() => {
        throw new Error('ESLint initialization failed');
      });

      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: 'const x = 1;',
        filePath: 'error.ts',
        config,
      });

      expect(stderrSpy).toHaveBeenCalledWith('ESLint error: ESLint initialization failed\n');
      expect(results).toStrictEqual([]);

      stderrSpy.mockRestore();
    });

    it('ERROR: {lintText throws} => logs error and returns empty array', async () => {
      const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => {
        return true;
      });

      const mockLintText = jest.fn().mockRejectedValue(new Error('Lint processing failed'));
      const mockESLintInstance = createMockESLintInstance({ lintText: mockLintText });
      mockESLint.mockImplementation(() => {
        return mockESLintInstance;
      });

      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: 'const x = 1;',
        filePath: 'error.ts',
        config,
      });

      expect(stderrSpy).toHaveBeenCalledWith('ESLint error: Lint processing failed\n');
      expect(results).toStrictEqual([]);

      stderrSpy.mockRestore();
    });

    it('ERROR: {fallback ESLint throws} => logs error and returns empty array', async () => {
      const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => {
        return true;
      });

      // First ESLint instance returns TSConfig error
      const mockLintTextFirst = jest.fn().mockResolvedValueOnce([
        {
          filePath: '/test/fallback-error.ts',
          messages: [
            {
              line: 1,
              column: 1,
              message:
                'parserOptions.project has been set for @typescript-eslint/parser. TSConfig does not include this file',
              severity: 2,
              ruleId: null,
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      ]);

      // Second ESLint instance (fallback) throws
      mockESLint
        .mockImplementationOnce(() => {
          return createMockESLintInstance({ lintText: mockLintTextFirst });
        })
        .mockImplementationOnce(() => {
          throw new Error('Fallback ESLint failed');
        });

      const config: Linter.Config = {
        languageOptions: {
          parserOptions: {
            project: './tsconfig.json',
          },
        },
      };

      const results = await eslintLintRunTargetedBroker({
        content: 'const x = 1;',
        filePath: 'fallback-error.ts',
        config,
      });

      expect(stderrSpy).toHaveBeenCalledWith('ESLint error: Fallback ESLint failed\n');
      expect(results).toStrictEqual([]);

      stderrSpy.mockRestore();
    });

    it('ERROR: {non-Error thrown} => logs string representation and returns empty array', async () => {
      const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => {
        return true;
      });

      const mockLintText = jest
        .fn()
        .mockRejectedValue({ message: 'Custom error object', code: 500 });
      const mockESLintInstance = createMockESLintInstance({ lintText: mockLintText });
      mockESLint.mockImplementation(() => {
        return mockESLintInstance;
      });

      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: 'const x = 1;',
        filePath: 'object-error.ts',
        config,
      });

      expect(stderrSpy).toHaveBeenCalledWith(
        'ESLint error: {"message":"Custom error object","code":500}\n',
      );
      expect(results).toStrictEqual([]);

      stderrSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('EDGE: {content with special characters} => handles unicode correctly', async () => {
      const mockLintText = jest.fn().mockResolvedValue([
        {
          filePath: '/test/unicode.ts',
          messages: [
            {
              line: 1,
              column: 15,
              message: 'Unexpected character: 🚀',
              severity: 2,
              ruleId: 'unicode-check',
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      ]);

      const mockESLintInstance = createMockESLintInstance({ lintText: mockLintText });
      mockESLint.mockImplementation(() => {
        return mockESLintInstance;
      });

      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: 'const rocket = "🚀"; const chinese = "测试"; const emoji = "👍";',
        filePath: 'unicode.ts',
        config,
      });

      expect(mockLintText).toHaveBeenCalledWith(
        'const rocket = "🚀"; const chinese = "测试"; const emoji = "👍";',
        expect.objectContaining({
          filePath: expect.stringContaining('unicode.ts'),
        }),
      );

      expect(results).toStrictEqual([
        {
          filePath: '/test/unicode.ts',
          messages: [
            {
              line: 1,
              column: 15,
              message: 'Unexpected character: 🚀',
              severity: 2,
              ruleId: 'unicode-check',
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      ]);
    });

    it('EDGE: {very long file path} => handles long paths correctly', async () => {
      const longPath = `very/long/path/${'nested/'.repeat(50)}deeply/nested/file.ts`;

      const mockLintText = jest.fn().mockResolvedValue([
        {
          filePath: `${process.cwd()}/${longPath}`,
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);

      const mockESLintInstance = createMockESLintInstance({ lintText: mockLintText });
      mockESLint.mockImplementation(() => {
        return mockESLintInstance;
      });

      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: 'const x = 1;',
        filePath: longPath,
        config,
      });

      expect(mockLintText).toHaveBeenCalledWith('const x = 1;', {
        filePath: `${process.cwd()}/${longPath}`,
      });

      expect(results).toStrictEqual([
        {
          filePath: `${process.cwd()}/${longPath}`,
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);
    });

    it('EDGE: {config with undefined values} => handles undefined config values', async () => {
      const mockLintText = jest.fn().mockResolvedValue([
        {
          filePath: '/test/undefined-config.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);

      const mockESLintInstance = createMockESLintInstance({ lintText: mockLintText });
      mockESLint.mockImplementation(() => {
        return mockESLintInstance;
      });

      const config: Linter.Config = {
        languageOptions: {},
      };

      const results = await eslintLintRunTargetedBroker({
        content: 'const x = 1;',
        filePath: 'undefined-config.ts',
        config,
      });

      expect(mockESLint).toHaveBeenCalledWith({
        cwd: process.cwd(),
        overrideConfigFile: true,
        overrideConfig: [config],
      });

      expect(results).toStrictEqual([
        {
          filePath: '/test/undefined-config.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);
    });

    it('EDGE: {multiple ESLint results} => transforms all results', async () => {
      const mockLintText = jest.fn().mockResolvedValue([
        {
          filePath: '/test/file1.ts',
          messages: [
            {
              line: 1,
              column: 5,
              message: 'First file error',
              severity: 2,
              ruleId: 'error-rule',
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
        {
          filePath: '/test/file2.ts',
          messages: [
            {
              line: 2,
              column: 10,
              message: 'Second file warning',
              severity: 1,
              ruleId: 'warn-rule',
            },
          ],
          errorCount: 0,
          warningCount: 1,
        },
        {
          filePath: '/test/file3.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);

      const mockESLintInstance = createMockESLintInstance({ lintText: mockLintText });
      mockESLint.mockImplementation(() => {
        return mockESLintInstance;
      });

      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: 'multi-file content',
        filePath: 'multi.ts',
        config,
      });

      expect(results).toStrictEqual([
        {
          filePath: '/test/file1.ts',
          messages: [
            {
              line: 1,
              column: 5,
              message: 'First file error',
              severity: 2,
              ruleId: 'error-rule',
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
        {
          filePath: '/test/file2.ts',
          messages: [
            {
              line: 2,
              column: 10,
              message: 'Second file warning',
              severity: 1,
              ruleId: 'warn-rule',
            },
          ],
          errorCount: 0,
          warningCount: 1,
        },
        {
          filePath: '/test/file3.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);
    });
  });
});
