/**
 * PURPOSE: Proxy for eslint-output-fixes-adapter that mocks ESLint.outputFixes static method
 *
 * USAGE:
 * const proxy = eslintOutputFixesAdapterProxy();
 * proxy.writesSuccessfully({ results });
 * await eslintOutputFixesAdapter({ results });
 */
import { ESLint } from 'eslint';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

export const eslintOutputFixesAdapterProxy = (): {
  writesSuccessfully: (params: { results: readonly ESLint.LintResult[] }) => void;
  throwsError: (params: { results: readonly ESLint.LintResult[]; error: Error }) => void;
  getCallsFor: (params: { results: readonly ESLint.LintResult[] }) => readonly unknown[][];
} => {
  const outputFixesHandle: SpyOnHandle = registerSpyOn({ object: ESLint, method: 'outputFixes' });

  return {
    // The results array IS the address — outputFixes writes whatever fixes are on it, so a test
    // staging one file's results must not answer for a call carrying a different file's results.
    writesSuccessfully: ({ results }): void => {
      outputFixesHandle.calledWith([results]).resolves({ success: true as const });
    },

    throwsError: ({ results, error }): void => {
      outputFixesHandle.calledWith([results]).rejects(error);
    },

    getCallsFor: ({ results }): readonly unknown[][] => outputFixesHandle.callsMatching([results]),
  };
};
