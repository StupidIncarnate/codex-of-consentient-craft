/**
 * PURPOSE: Proxy for eslint-lint-run-targeted-broker that delegates to adapter proxies
 *
 * USAGE:
 * const proxy = eslintLintRunTargetedBrokerProxy();
 * proxy.returnsLintResults({ content: 'const x = 1;', results: [...] });
 * const results = await eslintLintRunTargetedBroker({ content: 'const x = 1;', filePath, config });
 */

import type { ESLint } from '#gateway/npm/eslint';
import { ESLintProxy } from '#gateway/npm/eslint/eslint/eslint.proxy';
import { resolve } from '#gateway/node/path';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';

export const eslintLintRunTargetedBrokerProxy = (): {
  setupLintResults: (params: {
    oldContent: string;
    oldResults: readonly Partial<Awaited<ReturnType<ESLint['lintText']>>[number]>[];
    newResults: readonly Partial<Awaited<ReturnType<ESLint['lintText']>>[number]>[];
  }) => void;
  returnsLintResults: (params: {
    content: string;
    results: readonly Partial<Awaited<ReturnType<ESLint['lintText']>>[number]>[];
  }) => void;
  returnsLintResultsForDefaultCwd: (params: {
    content: string;
    filePath: string;
    results: readonly Partial<Awaited<ReturnType<ESLint['lintText']>>[number]>[];
  }) => void;
  throwsOnConstruction: (params: { cwd: string; error: Error }) => void;
  throwsOnLint: (params: { content: string; error: Error }) => void;
  getLintTextCallsFor: (params: { content: string }) => readonly unknown[][];
  getStderrText: ReturnType<typeof stderrProxy>['getWrittenText'];
} => {
  const cwdGateway = cwdProxy();
  const stderrGateway = stderrProxy();

  const eslint = ESLintProxy();

  return {
    // Old and new lint runs share a filePath but differ in content — that's the real signal
    // production code uses to tell them apart (violations-check-new-broker.ts lints the same
    // file's before/after content in parallel). oldContent is a known literal at setup time; the
    // new content comes from whatever edit the caller's test applies, which this proxy cannot
    // predict, so it is addressed as "anything that isn't the known old content."
    setupLintResults: ({ oldContent, oldResults, newResults }): void => {
      eslint.lintTextReturns({ text: oldContent, results: oldResults });
      eslint.lintTextReturns({
        text: (content: unknown) => content !== oldContent,
        results: newResults,
      });
    },

    returnsLintResults: ({ content, results }): void => {
      eslint.lintTextReturns({ text: content, results });
    },

    // Addressed by the staged '/default/cwd' (via the real resolve of it and the file path) rather
    // than by content alone — this is what a caller that omits `cwd` actually resolves and lints
    // against, so a broker that stops calling cwd() on that branch fails whatever test stages this.
    returnsLintResultsForDefaultCwd: ({ content, filePath, results }): void => {
      // A fixed directory, not the real process.cwd(), so a test on the no-cwd branch never
      // depends on where jest runs.
      cwdGateway.setupCwd({ value: '/default/cwd' });
      const absolutePath = resolve('/default/cwd', filePath);
      eslint.lintTextReturns({ text: content, filePath: absolutePath, results });
    },

    throwsOnConstruction: ({ cwd: constructionCwd, error }): void => {
      eslint.constructionThrows({ cwd: constructionCwd, error });
    },

    throwsOnLint: ({ content, error }): void => {
      eslint.lintTextRejects({ text: content, error });
    },

    // The full `(text, { filePath })` tuple of every lintText call for that text — the only place
    // a test sees which path the broker handed ESLint and how many lint passes it made.
    getLintTextCallsFor: ({ content }): readonly unknown[][] =>
      eslint.getLintTextCallsFor({ text: content }),

    getStderrText: stderrGateway.getWrittenText,
  };
};
