import { eslintLintRunTargetedBroker } from './eslint-lint-run-targeted-broker';
import { eslintLintRunTargetedBrokerProxy } from './eslint-lint-run-targeted-broker.proxy';
import { FlatConfigStub } from '#gateway/npm/typescript-eslint__utils/flat-config/flat-config.stub';

describe('eslintLintRunTargetedBroker()', () => {
  describe('valid input', () => {
    it('VALID: {content: "const x = 1;", filePath: "test.ts", config: {}} => returns transformed results', async () => {
      const proxy = eslintLintRunTargetedBrokerProxy();

      proxy.returnsLintResults({
        content: 'const x = 1;',
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
          },
        ],
      });

      const config = FlatConfigStub({ rules: { 'prefer-const': 'warn' } });
      const results = await eslintLintRunTargetedBroker({
        cwd: '/home/test',
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

      proxy.returnsLintResults({
        content: 'const x = 1;',
        results: [
          {
            filePath: '/custom/test.ts',
            messages: [],
            errorCount: 0,
            warningCount: 0,
          },
        ],
      });

      const config = FlatConfigStub();
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

  describe('cwd resolution', () => {
    it('VALID: {content, filePath, config, cwd: "/project"} => lints the path resolved against that cwd', async () => {
      const proxy = eslintLintRunTargetedBrokerProxy();

      proxy.returnsLintResultsForCwd({
        cwd: '/project',
        content: 'const marker = 1;',
        filePath: 'marker.ts',
        results: [
          {
            filePath: '/project/marker.ts',
            messages: [],
            errorCount: 0,
            warningCount: 0,
          },
        ],
      });

      const config = FlatConfigStub();
      const results = await eslintLintRunTargetedBroker({
        cwd: '/project',
        content: 'const marker = 1;',
        filePath: 'marker.ts',
        config,
      });

      expect(results).toStrictEqual([
        {
          filePath: '/project/marker.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);
    });
  });

  describe('empty content handling', () => {
    it('EMPTY: {content: "", filePath: "test.ts", config: {}} => returns empty array', async () => {
      eslintLintRunTargetedBrokerProxy();
      const config = FlatConfigStub();
      const results = await eslintLintRunTargetedBroker({
        cwd: '/home/test',
        content: '',
        filePath: 'test.ts',
        config,
      });

      expect(results).toStrictEqual([]);
    });

    it('EMPTY: {content: "   ", filePath: "test.ts", config: {}} => returns empty array', async () => {
      eslintLintRunTargetedBrokerProxy();
      const config = FlatConfigStub();
      const results = await eslintLintRunTargetedBroker({
        cwd: '/home/test',
        content: '   ',
        filePath: 'test.ts',
        config,
      });

      expect(results).toStrictEqual([]);
    });

    it('EMPTY: {content: "\\n\\t  \\n", filePath: "test.ts", config: {}} => returns empty array', async () => {
      eslintLintRunTargetedBrokerProxy();
      const config = FlatConfigStub();
      const results = await eslintLintRunTargetedBroker({
        cwd: '/home/test',
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

      proxy.returnsLintResults({
        content: 'const x = 1',
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
          },
        ],
      });

      const config = FlatConfigStub();
      const results = await eslintLintRunTargetedBroker({
        cwd: '/home/test',
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

      proxy.returnsLintResults({
        content: 'any x; let y = 1; function f() {}',
        results: [
          {
            filePath: '/test/multi.ts',
            messages: [
              {
                line: 1,
                column: 1,
                message: 'Unexpected any',
                severity: 2,
                ruleId: '@typescript-eslint/no-explicit-any',
              },
              {
                line: 1,
                column: 12,
                message: 'Prefer const',
                severity: 1,
                ruleId: 'prefer-const',
              },
              {
                line: 1,
                column: 25,
                message: 'Missing return type',
                severity: 2,
                ruleId: '@typescript-eslint/explicit-function-return-type',
              },
            ],
            errorCount: 2,
            warningCount: 1,
          },
        ],
      });

      const config = FlatConfigStub();
      const results = await eslintLintRunTargetedBroker({
        cwd: '/home/test',
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
              column: 1,
              message: 'Unexpected any',
              severity: 2,
              ruleId: '@typescript-eslint/no-explicit-any',
            },
            {
              line: 1,
              column: 12,
              message: 'Prefer const',
              severity: 1,
              ruleId: 'prefer-const',
            },
            {
              line: 1,
              column: 25,
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

    it('VALID: {eslint result with undefined ruleId} => handles undefined ruleId', async () => {
      const proxy = eslintLintRunTargetedBrokerProxy();

      proxy.returnsLintResults({
        content: 'syntax error code',
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
          },
        ],
      });

      const config = FlatConfigStub();
      const results = await eslintLintRunTargetedBroker({
        cwd: '/home/test',
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

      // First call returns TSConfig error, second call after retry returns actual lint results
      proxy.returnsLintResults({
        content: 'const x = 1',
        results: [
          {
            filePath: '/test/project.ts',
            messages: [
              {
                line: 1,
                column: 1,
                message:
                  'Parsing error: parserOptions.project has been set but TSConfig does not include this file',
                severity: 2,
                ruleId: null,
              },
            ],
            errorCount: 1,
            warningCount: 0,
          },
        ],
      });

      const config = FlatConfigStub();

      const results = await eslintLintRunTargetedBroker({
        cwd: '/home/test',
        content: 'const x = 1',
        filePath: 'project.ts',
        config,
      });

      // The broker detects the TSConfig error and retries, but since we mocked a single return,
      // the test expects the error result (not the retry result)
      expect(results).toStrictEqual([
        {
          filePath: '/test/project.ts',
          messages: [
            {
              line: 1,
              column: 1,
              message:
                'Parsing error: parserOptions.project has been set but TSConfig does not include this file',
              severity: 2,
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
      const proxy = eslintLintRunTargetedBrokerProxy();
      proxy.throwsOnConstruction({ cwd: '/broken', error: new Error('ESLint config invalid') });

      const results = await eslintLintRunTargetedBroker({
        content: 'const x = 1;',
        filePath: 'error.ts',
        config: FlatConfigStub(),
        cwd: '/broken',
      });

      expect({ results, stderr: proxy.getStderrText() }).toStrictEqual({
        results: [],
        stderr: 'ESLint error: ESLint config invalid\n',
      });
    });

    it('ERROR: {lintText rejects} => logs error and returns empty array', async () => {
      const proxy = eslintLintRunTargetedBrokerProxy();
      proxy.throwsOnLint({ content: 'const x = 1;', error: new Error('ESLint config invalid') });

      const results = await eslintLintRunTargetedBroker({
        content: 'const x = 1;',
        filePath: 'error.ts',
        config: FlatConfigStub(),
        cwd: '/custom',
      });

      expect({ results, stderr: proxy.getStderrText() }).toStrictEqual({
        results: [],
        stderr: 'ESLint error: ESLint config invalid\n',
      });
    });
  });

  describe('what reaches ESLint', () => {
    it('VALID: {content, filePath} => lintText gets the content and the resolved path, once', async () => {
      const proxy = eslintLintRunTargetedBrokerProxy();
      proxy.returnsLintResults({ content: 'const seen = 1;', results: [] });

      await eslintLintRunTargetedBroker({
        content: 'const seen = 1;',
        filePath: 'seen.ts',
        config: FlatConfigStub(),
        cwd: '/custom',
      });

      expect(proxy.getLintTextCallsFor({ content: 'const seen = 1;' })).toStrictEqual([
        ['const seen = 1;', { filePath: '/custom/seen.ts' }],
      ]);
    });

    it('EDGE: {TSConfig parsing error} => lintText runs a second time on the same content and path', async () => {
      const proxy = eslintLintRunTargetedBrokerProxy();
      proxy.returnsLintResults({
        content: 'const retry = 1;',
        results: [
          {
            filePath: '/test/retry.ts',
            messages: [
              {
                line: 1,
                column: 1,
                message: 'Parsing error: parserOptions.project has been set',
                severity: 2,
                ruleId: null,
              },
            ],
            errorCount: 1,
            warningCount: 0,
          },
        ],
      });

      await eslintLintRunTargetedBroker({
        content: 'const retry = 1;',
        filePath: 'retry.ts',
        config: FlatConfigStub(),
        cwd: '/custom',
      });

      expect(proxy.getLintTextCallsFor({ content: 'const retry = 1;' })).toStrictEqual([
        ['const retry = 1;', { filePath: '/custom/retry.ts' }],
        ['const retry = 1;', { filePath: '/custom/retry.ts' }],
      ]);
    });
  });
});
