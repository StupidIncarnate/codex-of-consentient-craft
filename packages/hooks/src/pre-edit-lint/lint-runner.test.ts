import { ESLint } from 'eslint';
import type { Linter } from 'eslint';
import { LintRunner } from './lint-runner';

jest.mock('eslint');

const mockESLint = ESLint as jest.MockedClass<typeof ESLint>;

describe('LintRunner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('runTargetedLint()', () => {
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

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = { rules: { 'prefer-const': 'warn' } };
        const results = await LintRunner.runTargetedLint({
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

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
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

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        await LintRunner.runTargetedLint({
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
        const results = await LintRunner.runTargetedLint({
          content: '',
          filePath: 'test.ts',
          config,
        });

        expect(results).toStrictEqual([]);
        expect(mockESLint).not.toHaveBeenCalled();
      });

      it('EMPTY: {content: "   ", filePath: "test.ts", config: {}} => returns empty array', async () => {
        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
          content: '   ',
          filePath: 'test.ts',
          config,
        });

        expect(results).toStrictEqual([]);
        expect(mockESLint).not.toHaveBeenCalled();
      });

      it('EMPTY: {content: "\\n\\t  \\n", filePath: "test.ts", config: {}} => returns empty array', async () => {
        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
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

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {
          rules: {
            'prefer-const': 'warn',
            'no-var': 'error',
          },
        };

        await LintRunner.runTargetedLint({
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

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

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

        await LintRunner.runTargetedLint({
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

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        await LintRunner.runTargetedLint({
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

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
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

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
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

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
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

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
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
          .mockImplementationOnce(() => ({ lintText: mockLintTextFirst }) as unknown as ESLint)
          .mockImplementationOnce(() => ({ lintText: mockLintTextSecond }) as unknown as ESLint);

        const config: Linter.Config = {
          languageOptions: {
            parserOptions: {
              project: './tsconfig.json',
            },
          },
        };

        const results = await LintRunner.runTargetedLint({
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
          .mockImplementationOnce(() => ({ lintText: mockLintTextFirst }) as unknown as ESLint)
          .mockImplementationOnce(() => ({ lintText: mockLintTextSecond }) as unknown as ESLint);

        const config: Linter.Config = {
          languageOptions: {
            parserOptions: {
              project: './tsconfig.json',
              ecmaVersion: 2022,
            },
          },
        };

        const results = await LintRunner.runTargetedLint({
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
          .mockImplementationOnce(() => ({ lintText: mockLintTextFirst }) as unknown as ESLint)
          .mockImplementationOnce(() => ({ lintText: mockLintTextSecond }) as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
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
          .mockImplementationOnce(() => ({ lintText: mockLintTextFirst }) as unknown as ESLint)
          .mockImplementationOnce(() => ({ lintText: mockLintTextSecond }) as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
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
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        mockESLint.mockImplementation(() => {
          throw new Error('ESLint initialization failed');
        });

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
          content: 'const x = 1;',
          filePath: 'error.ts',
          config,
        });

        expect(consoleSpy).toHaveBeenCalledWith('ESLint error:', 'ESLint initialization failed');
        expect(results).toStrictEqual([]);

        consoleSpy.mockRestore();
      });

      it('ERROR: {lintText throws} => logs error and returns empty array', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const mockLintText = jest.fn().mockRejectedValue(new Error('Lint processing failed'));
        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
          content: 'const x = 1;',
          filePath: 'error.ts',
          config,
        });

        expect(consoleSpy).toHaveBeenCalledWith('ESLint error:', 'Lint processing failed');
        expect(results).toStrictEqual([]);

        consoleSpy.mockRestore();
      });

      it('ERROR: {fallback ESLint throws} => logs error and returns empty array', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

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
          .mockImplementationOnce(() => ({ lintText: mockLintTextFirst }) as unknown as ESLint)
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

        const results = await LintRunner.runTargetedLint({
          content: 'const x = 1;',
          filePath: 'fallback-error.ts',
          config,
        });

        expect(consoleSpy).toHaveBeenCalledWith('ESLint error:', 'Fallback ESLint failed');
        expect(results).toStrictEqual([]);

        consoleSpy.mockRestore();
      });

      it('ERROR: {non-Error thrown} => logs string representation and returns empty array', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const mockLintText = jest
          .fn()
          .mockRejectedValue({ message: 'Custom error object', code: 500 });
        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
          content: 'const x = 1;',
          filePath: 'object-error.ts',
          config,
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          'ESLint error:',
          '{"message":"Custom error object","code":500}',
        );
        expect(results).toStrictEqual([]);

        consoleSpy.mockRestore();
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

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
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

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
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

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {
          languageOptions: {},
        };

        const results = await LintRunner.runTargetedLint({
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

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
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

  describe('convertEslintResultToLintResult()', () => {
    describe('message transformation', () => {
      it('VALID: {result with basic message} => transforms message fields correctly', async () => {
        const mockLintText = jest.fn().mockResolvedValue([
          {
            filePath: '/test/basic-message.ts',
            messages: [
              {
                line: 10,
                column: 15,
                message: 'Basic lint message',
                severity: 1,
                ruleId: 'basic-rule',
              },
            ],
            errorCount: 0,
            warningCount: 1,
          },
        ]);

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
          content: 'const x = 1;',
          filePath: 'basic-message.ts',
          config,
        });

        const firstResult = results[0];
        const firstMessage = firstResult?.messages[0];
        expect(firstMessage).toStrictEqual({
          line: 10,
          column: 15,
          message: 'Basic lint message',
          severity: 1,
          ruleId: 'basic-rule',
        });
      });

      it('VALID: {result with message without ruleId} => sets ruleId to undefined', async () => {
        const mockLintText = jest.fn().mockResolvedValue([
          {
            filePath: '/test/no-rule.ts',
            messages: [
              {
                line: 5,
                column: 8,
                message: 'Syntax error without rule',
                severity: 2,
                ruleId: null,
              },
            ],
            errorCount: 1,
            warningCount: 0,
          },
        ]);

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
          content: 'const x = 1;',
          filePath: 'no-rule.ts',
          config,
        });

        const firstResult = results[0];
        const firstMessage = firstResult?.messages[0];
        expect(firstMessage?.ruleId).toBeUndefined();
      });

      it('VALID: {result with message with ruleId} => preserves ruleId', async () => {
        const mockLintText = jest.fn().mockResolvedValue([
          {
            filePath: '/test/with-rule.ts',
            messages: [
              {
                line: 3,
                column: 12,
                message: 'Rule violation detected',
                severity: 2,
                ruleId: 'specific-rule',
              },
            ],
            errorCount: 1,
            warningCount: 0,
          },
        ]);

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
          content: 'const x = 1;',
          filePath: 'with-rule.ts',
          config,
        });

        const firstResult = results[0];
        const firstMessage = firstResult?.messages[0];
        expect(firstMessage?.ruleId).toBe('specific-rule');
      });

      it('VALID: {result with multiple messages} => transforms all messages', async () => {
        const mockLintText = jest.fn().mockResolvedValue([
          {
            filePath: '/test/multiple-messages.ts',
            messages: [
              {
                line: 1,
                column: 1,
                message: 'First message',
                severity: 2,
                ruleId: 'rule-one',
              },
              {
                line: 2,
                column: 5,
                message: 'Second message',
                severity: 1,
                ruleId: null,
              },
              {
                line: 3,
                column: 10,
                message: 'Third message',
                severity: 2,
                ruleId: 'rule-three',
              },
            ],
            errorCount: 2,
            warningCount: 1,
          },
        ]);

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
          content: 'const x = 1;',
          filePath: 'multiple-messages.ts',
          config,
        });

        const firstResult = results[0];
        expect(firstResult?.messages).toStrictEqual([
          {
            line: 1,
            column: 1,
            message: 'First message',
            severity: 2,
            ruleId: 'rule-one',
          },
          {
            line: 2,
            column: 5,
            message: 'Second message',
            severity: 1,
          },
          {
            line: 3,
            column: 10,
            message: 'Third message',
            severity: 2,
            ruleId: 'rule-three',
          },
        ]);
      });
    });

    describe('count preservation', () => {
      it('VALID: {result with errorCount and warningCount} => preserves counts', async () => {
        const mockLintText = jest.fn().mockResolvedValue([
          {
            filePath: '/test/counts.ts',
            messages: [],
            errorCount: 5,
            warningCount: 3,
          },
        ]);

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
          content: 'const x = 1;',
          filePath: 'counts.ts',
          config,
        });

        const firstResult = results[0];
        expect(firstResult?.errorCount).toBe(5);
        expect(firstResult?.warningCount).toBe(3);
      });

      it('EDGE: {result with zero counts} => preserves zero counts', async () => {
        const mockLintText = jest.fn().mockResolvedValue([
          {
            filePath: '/test/zero-counts.ts',
            messages: [],
            errorCount: 0,
            warningCount: 0,
          },
        ]);

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
          content: 'const x = 1;',
          filePath: 'zero-counts.ts',
          config,
        });

        const firstResult = results[0];
        expect(firstResult?.errorCount).toBe(0);
        expect(firstResult?.warningCount).toBe(0);
      });

      it('EDGE: {result with high counts} => preserves large counts', async () => {
        const mockLintText = jest.fn().mockResolvedValue([
          {
            filePath: '/test/high-counts.ts',
            messages: [],
            errorCount: 999,
            warningCount: 1500,
          },
        ]);

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
          content: 'const x = 1;',
          filePath: 'high-counts.ts',
          config,
        });

        const firstResult = results[0];
        expect(firstResult?.errorCount).toBe(999);
        expect(firstResult?.warningCount).toBe(1500);
      });
    });

    describe('file path handling', () => {
      it('VALID: {result with absolute path} => preserves file path', async () => {
        const mockLintText = jest.fn().mockResolvedValue([
          {
            filePath: '/absolute/path/to/file.ts',
            messages: [],
            errorCount: 0,
            warningCount: 0,
          },
        ]);

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
          content: 'const x = 1;',
          filePath: 'file.ts',
          config,
        });

        const firstResult = results[0];
        expect(firstResult?.filePath).toBe('/absolute/path/to/file.ts');
      });

      it('VALID: {result with relative path} => preserves file path', async () => {
        const mockLintText = jest.fn().mockResolvedValue([
          {
            filePath: 'relative/path/file.ts',
            messages: [],
            errorCount: 0,
            warningCount: 0,
          },
        ]);

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
          content: 'const x = 1;',
          filePath: 'file.ts',
          config,
        });

        const firstResult = results[0];
        expect(firstResult?.filePath).toBe('relative/path/file.ts');
      });

      it('VALID: {result with special characters in path} => preserves path correctly', async () => {
        const mockLintText = jest.fn().mockResolvedValue([
          {
            filePath: '/path/with spaces/and-special_chars/file (1).ts',
            messages: [],
            errorCount: 0,
            warningCount: 0,
          },
        ]);

        const mockESLintInstance = { lintText: mockLintText };
        mockESLint.mockImplementation(() => mockESLintInstance as unknown as ESLint);

        const config: Linter.Config = {};
        const results = await LintRunner.runTargetedLint({
          content: 'const x = 1;',
          filePath: 'file.ts',
          config,
        });

        const firstResult = results[0];
        expect(firstResult?.filePath).toBe('/path/with spaces/and-special_chars/file (1).ts');
      });
    });
  });
});
