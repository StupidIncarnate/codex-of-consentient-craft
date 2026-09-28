/**
 * PURPOSE: Proxy for eslint-lint-run-with-fix-broker that delegates to adapter proxies
 *
 * USAGE:
 * const proxy = eslintLintRunWithFixBrokerProxy();
 * proxy.returnsLintResults({ filePath: 'test.ts', results: [...] });
 * const results = await eslintLintRunWithFixBroker({ filePath, config, cwd });
 */

import { ESLint } from '#gateway/npm/eslint';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { resolve } from '#gateway/node/path';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { cwd } from '#gateway/node/process';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
} from '@dungeonmaster/testing/register-mock';

registerModuleMock({ module: '#gateway/npm/eslint' });

export const eslintLintRunWithFixBrokerProxy = (): {
  returnsLintResults: (params: { filePath: string; results: unknown[] }) => void;
  returnsLintResultsForDefaultCwd: (params: { filePath: string; results: unknown[] }) => void;
} => {
  cwdProxy();
  // cwdProxy() itself stages nothing (the gateway wrapper offers no staging surface), so the
  // no-cwd branch is staged directly on the gateway function it calls — a fixed address, not
  // the real process.cwd(), so a test built on it never depends on where jest runs.
  const cwdHandle = registerMock({ fn: cwd });
  cwdHandle.calledWith([]).returns('/default/cwd');
  readFileProxy();
  const resolveHandle = registerMock({ fn: resolve });

  // This broker's own resolve call needs an explicit fallback. Restore "return the
  // last segment" — i.e. resolve(cwd, filePath) => filePath — locally, scoped to this proxy, so
  // the raw filePath the broker was called with is what lintFiles actually receives.
  resolveHandle
    .calledWith([])
    .implement((...segments: unknown[]) => segments[segments.length - 1] ?? '');

  const lintFilesHandle = registerSpyOn({
    object: ESLint.prototype,
    method: 'lintFiles',
  });
  const outputFixesHandle = registerSpyOn({
    object: ESLint,
    method: 'outputFixes',
  });

  return {
    // lintFiles receives a single argument: an array of the (resolved) paths to lint. This
    // broker always lints exactly one file, so the address is that one-element array.
    returnsLintResults: ({ filePath, results }): void => {
      lintFilesHandle.calledWith([[filePath]]).resolves(results);
      // The broker feeds the SAME results array straight into ESLint.outputFixes() next —
      // address it by the exact array lintFiles just resolved so the write step succeeds too.
      outputFixesHandle.calledWith([results]).resolves(undefined);
    },

    // Addressed by the staged '/default/cwd' (via the resolved absolute path) rather than by the
    // raw filePath alone — this is what a caller that omits `cwd` actually resolves and lints
    // against, so a broker that stops calling cwd() on that branch fails whatever test stages
    // this.
    returnsLintResultsForDefaultCwd: ({ filePath, results }): void => {
      const absolutePath = `/default/cwd/resolved/${filePath}`;
      resolveHandle.calledWith(['/default/cwd', filePath]).returns(absolutePath);
      lintFilesHandle.calledWith([[absolutePath]]).resolves(results);
      outputFixesHandle.calledWith([results]).resolves(undefined);
    },
  };
};
