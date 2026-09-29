/**
 * PURPOSE: Proxy for eslint-lint-run-with-fix-broker that delegates to adapter proxies
 *
 * USAGE:
 * const proxy = eslintLintRunWithFixBrokerProxy();
 * proxy.returnsLintResults({ filePath: 'test.ts', results: [...] });
 * const results = await eslintLintRunWithFixBroker({ filePath, config, cwd });
 */

import type { ESLint } from '#gateway/npm/eslint';
import { ESLintProxy } from '#gateway/npm/eslint/eslint/eslint.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { resolve } from '#gateway/node/path';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { cwd } from '#gateway/node/process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const eslintLintRunWithFixBrokerProxy = (): {
  returnsLintResults: (params: {
    cwd?: string;
    filePath: string;
    results: readonly Partial<Awaited<ReturnType<ESLint['lintText']>>[number]>[];
  }) => void;
  returnsLintResultsForDefaultCwd: (params: {
    filePath: string;
    results: readonly Partial<Awaited<ReturnType<ESLint['lintText']>>[number]>[];
  }) => void;
  getLintedFilesFor: (params: { files: readonly string[] }) => readonly unknown[][];
  getFixesWrittenFor: (params: {
    results: readonly Partial<Awaited<ReturnType<ESLint['lintText']>>[number]>[];
  }) => readonly unknown[][];
  getStderrText: ReturnType<typeof stderrProxy>['getWrittenText'];
} => {
  cwdProxy();
  const stderrGateway = stderrProxy();
  // cwdProxy() itself stages nothing (the gateway wrapper offers no staging surface), so the
  // no-cwd branch is staged directly on the gateway function it calls — a fixed address, not
  // the real process.cwd(), so a test built on it never depends on where jest runs.
  const cwdHandle = registerMock({ fn: cwd });
  cwdHandle.calledWith([]).returns('/default/cwd');
  readFileProxy();

  const eslint = ESLintProxy();

  return {
    // lintFiles receives a single argument: an array of the (resolved) paths to lint. This
    // broker always lints exactly one file, so the address is that one-element array.
    returnsLintResults: ({ cwd: workingDir, filePath, results }): void => {
      eslint.lintFilesReturns({ files: [resolve(workingDir ?? '/', filePath)], results });
      // The broker feeds the SAME results array straight into ESLint.outputFixes() next —
      // address it by the exact array lintFiles just resolved so the write step succeeds too.
      eslint.outputFixesResolves({ results });
    },

    // Addressed by the staged '/default/cwd' (via the resolved absolute path) rather than by the
    // raw filePath alone — this is what a caller that omits `cwd` actually resolves and lints
    // against, so a broker that stops calling cwd() on that branch fails whatever test stages
    // this.
    returnsLintResultsForDefaultCwd: ({ filePath, results }): void => {
      const absolutePath = resolve('/default/cwd', filePath);
      eslint.lintFilesReturns({ files: [absolutePath], results });
      eslint.outputFixesResolves({ results });
    },

    // What the broker really handed lintFiles, and what it wrote back to disk.
    getLintedFilesFor: ({ files }): readonly unknown[][] => eslint.getLintFilesCallsFor({ files }),
    getFixesWrittenFor: ({ results }): readonly unknown[][] =>
      eslint.getOutputFixesCallsFor({ results }),
    getStderrText: stderrGateway.getWrittenText,
  };
};
