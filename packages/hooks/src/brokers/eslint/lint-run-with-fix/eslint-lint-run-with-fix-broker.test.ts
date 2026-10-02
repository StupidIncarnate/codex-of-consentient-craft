import { eslintLintRunWithFixBroker } from './eslint-lint-run-with-fix-broker';
import { eslintLintRunWithFixBrokerProxy } from './eslint-lint-run-with-fix-broker.proxy';
import { lintSeverityStatics } from '../../../statics/lint-severity/lint-severity-statics';
import { FlatConfigStub } from '#gateway/npm/typescript-eslint__utils/flat-config/flat-config.stub';

describe('eslintLintRunWithFixBroker()', () => {
  describe('with errors only', () => {
    it('VALID: {filePath, config} => returns only error-level violations after filtering warnings', async () => {
      const proxy = eslintLintRunWithFixBrokerProxy();

      proxy.returnsLintResults({
        cwd: '/home/test',
        filePath: 'test.ts',
        results: [
          {
            filePath: '/home/test/test.ts',
            messages: [
              {
                line: 1,
                column: 7,
                message: 'Missing return type',
                severity: lintSeverityStatics.error,
                ruleId: 'explicit-return-types',
              },
              {
                line: 2,
                column: 5,
                message: 'Prefer const',
                severity: lintSeverityStatics.warning,
                ruleId: 'prefer-const',
              },
            ],
            errorCount: 1,
            warningCount: 1,
          },
        ],
      });

      const config = FlatConfigStub({ rules: { 'explicit-return-types': 'error' } });
      const results = await eslintLintRunWithFixBroker({
        filePath: 'test.ts',
        config,
        cwd: '/home/test',
      });

      expect(results).toStrictEqual([
        {
          filePath: '/home/test/test.ts',
          messages: [
            {
              line: 1,
              column: 7,
              message: 'Missing return type',
              severity: 2,
              ruleId: 'explicit-return-types',
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      ]);
    });

    it('VALID: {filePath, config} => returns empty array when only warnings exist', async () => {
      const proxy = eslintLintRunWithFixBrokerProxy();

      proxy.returnsLintResults({
        cwd: '/home/test',
        filePath: 'test.ts',
        results: [
          {
            filePath: '/home/test/test.ts',
            messages: [
              {
                line: 1,
                column: 5,
                message: 'Prefer const',
                severity: lintSeverityStatics.warning,
                ruleId: 'prefer-const',
              },
            ],
            errorCount: 0,
            warningCount: 1,
          },
        ],
      });

      const config = FlatConfigStub({ rules: { 'prefer-const': 'warn' } });
      const results = await eslintLintRunWithFixBroker({
        filePath: 'test.ts',
        config,
        cwd: '/home/test',
      });

      expect(results).toStrictEqual([
        {
          filePath: '/home/test/test.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);
    });
  });

  describe('with no violations', () => {
    it('VALID: {filePath, config} => returns empty results array', async () => {
      const proxy = eslintLintRunWithFixBrokerProxy();

      proxy.returnsLintResults({
        cwd: '/home/test',
        filePath: 'test.ts',
        results: [
          {
            filePath: '/home/test/test.ts',
            messages: [],
            errorCount: 0,
            warningCount: 0,
          },
        ],
      });

      const config = FlatConfigStub({ rules: {} });
      const results = await eslintLintRunWithFixBroker({
        cwd: '/home/test',
        filePath: 'test.ts',
        config,
      });

      expect(results).toStrictEqual([
        {
          filePath: '/home/test/test.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);
    });
  });

  describe('with multiple errors', () => {
    it('VALID: {filePath, config} => returns all error-level violations', async () => {
      const proxy = eslintLintRunWithFixBrokerProxy();

      proxy.returnsLintResults({
        cwd: '/home/test',
        filePath: 'test.ts',
        results: [
          {
            filePath: '/home/test/test.ts',
            messages: [
              {
                line: 1,
                column: 7,
                message: 'Missing return type',
                severity: lintSeverityStatics.error,
                ruleId: 'explicit-return-types',
              },
              {
                line: 3,
                column: 2,
                message: 'Unexpected console',
                severity: lintSeverityStatics.error,
                ruleId: 'no-console',
              },
            ],
            errorCount: 2,
            warningCount: 0,
          },
        ],
      });

      const config = FlatConfigStub({ rules: { 'explicit-return-types': 'error' } });
      const results = await eslintLintRunWithFixBroker({
        filePath: 'test.ts',
        config,
        cwd: '/home/test',
      });

      expect(results).toStrictEqual([
        {
          filePath: '/home/test/test.ts',
          messages: [
            {
              line: 1,
              column: 7,
              message: 'Missing return type',
              severity: 2,
              ruleId: 'explicit-return-types',
            },
            {
              line: 3,
              column: 2,
              message: 'Unexpected console',
              severity: 2,
              ruleId: 'no-console',
            },
          ],
          errorCount: 2,
          warningCount: 0,
        },
      ]);
    });
  });

  describe('what reaches ESLint', () => {
    it('VALID: {filePath, cwd} => lints the resolved path and writes the fixes back', async () => {
      const proxy = eslintLintRunWithFixBrokerProxy();
      proxy.returnsLintResults({
        cwd: '/home/test',
        filePath: 'fixed.ts',
        results: [
          { filePath: '/home/test/fixed.ts', messages: [], errorCount: 0, warningCount: 0 },
        ],
      });

      await eslintLintRunWithFixBroker({
        filePath: 'fixed.ts',
        config: FlatConfigStub(),
        cwd: '/home/test',
      });

      expect({
        linted: proxy.getLintedFilesFor({ files: ['/home/test/fixed.ts'] }),
        written: proxy.getFixesWrittenFor({
          results: [
            { filePath: '/home/test/fixed.ts', messages: [], errorCount: 0, warningCount: 0 },
          ],
        }),
      }).toStrictEqual({
        linted: [[['/home/test/fixed.ts']]],
        written: [
          [[{ filePath: '/home/test/fixed.ts', messages: [], errorCount: 0, warningCount: 0 }]],
        ],
      });
    });
  });
});
