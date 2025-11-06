import type { Linter } from 'eslint';
import { eslintLintRunTargetedBroker } from './eslint-lint-run-targeted-broker';
import { eslintLintRunTargetedBrokerProxy } from './eslint-lint-run-targeted-broker.proxy';

describe('eslintLintRunTargetedBroker()', () => {
  describe('valid input', () => {
    it('VALID: {content: "const x = 1;", filePath: "test.ts", config: {}} => returns transformed results', async () => {
      const proxy = eslintLintRunTargetedBrokerProxy();
      proxy.setupLintResults({
        results: [
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
            fixableErrorCount: 0,
            fixableWarningCount: 0,
            usedDeprecatedRules: [],
            suppressedMessages: [],
            fatalErrorCount: 0,
          },
        ],
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
      const proxy = eslintLintRunTargetedBrokerProxy();
      proxy.setupLintResults({
        results: [
          {
            filePath: '/custom/test.ts',
            messages: [],
            errorCount: 0,
            warningCount: 0,
            fixableErrorCount: 0,
            fixableWarningCount: 0,
            usedDeprecatedRules: [],
          },
        ],
      });

      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: 'const x = 1;',
        filePath: 'test.ts',
        config,
        cwd: '/custom',
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
  });

  describe('empty content handling', () => {
    it('EMPTY: {content: "", filePath: "test.ts", config: {}} => returns empty array', async () => {
      const proxy = eslintLintRunTargetedBrokerProxy();
      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: '',
        filePath: 'test.ts',
        config,
      });

      expect(results).toStrictEqual([]);
    });

    it('EMPTY: {content: "   ", filePath: "test.ts", config: {}} => returns empty array', async () => {
      const proxy = eslintLintRunTargetedBrokerProxy();
      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: '   ',
        filePath: 'test.ts',
        config,
      });

      expect(results).toStrictEqual([]);
    });

    it('EMPTY: {content: "\\n\\t  \\n", filePath: "test.ts", config: {}} => returns empty array', async () => {
      const proxy = eslintLintRunTargetedBrokerProxy();
      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: '\n\t  \n',
        filePath: 'test.ts',
        config,
      });

      expect(results).toStrictEqual([]);
    });
  });

  describe('result transformation', () => {
    it('VALID: {eslint result with messages} => transforms to LintResult format', async () => {
      const proxy = eslintLintRunTargetedBrokerProxy();
      proxy.setupLintResults({
        results: [
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
            fixableErrorCount: 0,
            fixableWarningCount: 0,
            usedDeprecatedRules: [],
          },
        ],
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
      const proxy = eslintLintRunTargetedBrokerProxy();
      proxy.setupLintResults({
        results: [
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
            fixableErrorCount: 0,
            fixableWarningCount: 0,
            usedDeprecatedRules: [],
          },
        ],
      });

      const config: Linter.Config = {};
      const results = await eslintLintRunTargetedBroker({
        content: 'any x; let y = 1; function f() {}',
        filePath: 'multi.ts',
        config,
      });

      expect(results).toHaveLength(1);
      expect(results[0]?.messages).toHaveLength(3);
      expect(results[0]?.errorCount).toBe(2);
      expect(results[0]?.warningCount).toBe(1);
    });

    it('VALID: {eslint result with undefined ruleId} => handles undefined ruleId', async () => {
      const proxy = eslintLintRunTargetedBrokerProxy();
      proxy.setupLintResults({
        results: [
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
            fixableErrorCount: 0,
            fixableWarningCount: 0,
            usedDeprecatedRules: [],
          },
        ],
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
      const proxy = eslintLintRunTargetedBrokerProxy();
      proxy.setupProjectError({
        firstResults: [
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
            fixableErrorCount: 0,
            fixableWarningCount: 0,
            usedDeprecatedRules: [],
          },
        ],
        fallbackResults: [
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
            fixableErrorCount: 0,
            fixableWarningCount: 0,
            usedDeprecatedRules: [],
          },
        ],
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
  });

  describe('error handling', () => {
    it('ERROR: {ESLint constructor throws} => logs error and returns empty array', async () => {
      const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => {
        return true;
      });

      const proxy = eslintLintRunTargetedBrokerProxy();
      proxy.setupLintError({ error: new Error('ESLint initialization failed') });

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
  });
});
