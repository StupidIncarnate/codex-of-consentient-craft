/**
 * PURPOSE: Proxy for eslint-lint-run-with-fix-broker that delegates to adapter proxies
 *
 * USAGE:
 * const proxy = eslintLintRunWithFixBrokerProxy();
 * proxy.returnsLintResults({ filePath: 'test.ts', results: [...] });
 * const results = await eslintLintRunWithFixBroker({ filePath, config, cwd });
 */

import { eslintEslintAdapterProxy } from '../../../adapters/eslint/eslint/eslint-eslint-adapter.proxy';
import { eslintOutputFixesAdapterProxy } from '../../../adapters/eslint/output-fixes/eslint-output-fixes-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { pathResolveAdapterProxy } from '../../../adapters/path/resolve/path-resolve-adapter.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { cwd } from '#gateway/node/process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

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
  const eslintProxy = eslintEslintAdapterProxy();
  const outputFixesProxy = eslintOutputFixesAdapterProxy();
  fsReadFileAdapterProxy();
  const resolveProxy = pathResolveAdapterProxy();

  // pathResolveAdapterProxy no longer carries a global default (it's argument-addressed now), so
  // this broker's own pathResolveAdapter call needs an explicit fallback. Restore "return the
  // last segment" — i.e. resolve(cwd, filePath) => filePath — locally, scoped to this proxy, so
  // the raw filePath the broker was called with is what lintFiles actually receives.
  resolveProxy
    .getHandle()
    .calledWith([])
    .implement((...segments: unknown[]) => segments[segments.length - 1] ?? '');

  const lintFilesHandle = eslintProxy.getLintFilesHandle();

  return {
    // lintFiles receives a single argument: an array of the (resolved) paths to lint. This
    // broker always lints exactly one file, so the address is that one-element array.
    returnsLintResults: ({ filePath, results }): void => {
      lintFilesHandle.calledWith([[filePath]]).resolves(results);
      // The broker feeds the SAME results array straight into ESLint.outputFixes() next —
      // address it by the exact array lintFiles just resolved so the write step succeeds too.
      outputFixesProxy.writesSuccessfully({ results: results as never });
    },

    // Addressed by the staged '/default/cwd' (via the resolved absolute path) rather than by the
    // raw filePath alone — this is what a caller that omits `cwd` actually resolves and lints
    // against, so a broker that stops calling cwd() on that branch fails whatever test stages
    // this.
    returnsLintResultsForDefaultCwd: ({ filePath, results }): void => {
      const absolutePath = `/default/cwd/resolved/${filePath}`;
      resolveProxy.getHandle().calledWith(['/default/cwd', filePath]).returns(absolutePath);
      lintFilesHandle.calledWith([[absolutePath]]).resolves(results);
      outputFixesProxy.writesSuccessfully({ results: results as never });
    },
  };
};
