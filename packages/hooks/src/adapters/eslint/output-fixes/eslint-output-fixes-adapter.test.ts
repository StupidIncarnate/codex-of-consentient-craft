/**
 * PURPOSE: Tests for eslint-output-fixes-adapter that verifies ESLint fix writing behavior
 *
 * USAGE:
 * npm test -- eslint-output-fixes-adapter.test.ts
 */
import { eslintOutputFixesAdapter } from './eslint-output-fixes-adapter';
import { eslintOutputFixesAdapterProxy } from './eslint-output-fixes-adapter.proxy';
import type { ESLint } from 'eslint';

const createLintResult = (overrides: Partial<ESLint.LintResult> = {}): ESLint.LintResult => ({
  filePath: '/test/file.ts',
  messages: [],
  suppressedMessages: [],
  errorCount: 0,
  fatalErrorCount: 0,
  warningCount: 0,
  fixableErrorCount: 0,
  fixableWarningCount: 0,
  usedDeprecatedRules: [],
  ...overrides,
});

describe('eslintOutputFixesAdapter', () => {
  describe('successful writes', () => {
    it('VALID: {results: with fixes} => calls ESLint.outputFixes', async () => {
      const proxy = eslintOutputFixesAdapterProxy();
      const results = [createLintResult({ output: 'const x = 1;' })];

      proxy.writesSuccessfully({ results });

      await eslintOutputFixesAdapter({ results });

      expect(proxy.getCallsFor({ results })).toStrictEqual([[results]]);
    });

    it('EMPTY: {results: empty} => calls ESLint.outputFixes with empty array', async () => {
      const proxy = eslintOutputFixesAdapterProxy();
      const emptyResults: ESLint.LintResult[] = [];

      proxy.writesSuccessfully({ results: emptyResults });

      await eslintOutputFixesAdapter({ results: emptyResults });

      expect(proxy.getCallsFor({ results: emptyResults })).toStrictEqual([[emptyResults]]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {outputFixes fails} => throws error', async () => {
      const proxy = eslintOutputFixesAdapterProxy();
      const results = [createLintResult()];
      const expectedError = new Error('EACCES: permission denied');

      proxy.throwsError({ results, error: expectedError });

      await expect(eslintOutputFixesAdapter({ results })).rejects.toThrow(/EACCES/u);
    });
  });
});
