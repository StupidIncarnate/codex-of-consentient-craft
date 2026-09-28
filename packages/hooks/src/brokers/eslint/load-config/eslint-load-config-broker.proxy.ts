/**
 * PURPOSE: Proxy for eslint-load-config-broker that stages the config ESLint calculates per file path
 *
 * USAGE:
 * const proxy = eslintLoadConfigBrokerProxy();
 * proxy.returnsConfig({ filePath: 'src/file.ts', config: LinterConfigStub() });
 * const config = await eslintLoadConfigBroker({ cwd: '/project/path', filePath: 'src/file.ts' });
 */

import { ESLintProxy } from '#gateway/npm/eslint/eslint/eslint.proxy';
import { resolve } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { eslintFallbackPathsBrokerProxy } from '../fallback-paths/eslint-fallback-paths-broker.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { cwd } from '#gateway/node/process';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const eslintLoadConfigBrokerProxy = (): {
  returnsConfig: (params: { filePath: string; config: Record<PropertyKey, unknown> }) => void;
  returnsNullConfig: (params: { filePath: string }) => void;
  throwsOnConstruction: (params: { cwd: string; error: Error }) => void;
  throwsOnCalculate: (params: { filePath: string; error: Error }) => void;
  getCalculatedFor: (params: { filePath: string }) => readonly unknown[][];
} => {
  // Create child proxies
  cwdProxy();
  // cwdProxy() itself stages nothing (the gateway wrapper offers no staging surface), so the
  // no-cwd branch is staged directly on the gateway function it calls — a fixed address, not
  // the real process.cwd(), so this test's outcome never depends on where jest runs.
  const cwdHandle = registerMock({ fn: cwd });
  cwdHandle.calledWith([]).returns('/default/cwd');
  const resolveHandle = registerMock({ fn: resolve });
  const existsProxy = existsSyncProxy();
  eslintFallbackPathsBrokerProxy();
  const eslint = ESLintProxy();

  for (const configName of locationsStatics.repoRoot.eslintConfig) {
    existsProxy.returns({ path: configName, exists: false });
  }

  // This broker uses the resolved cwd as a Map cache key across the module-level configCache, so
  // a fixed placeholder here would collapse every test's cwd onto one cache entry and leak
  // results between tests. Restore "return the last segment" — i.e. resolve(cwd) => cwd, and
  // resolve(dir, configName) => configName — locally, scoped to this proxy, so each test's cwd
  // still produces its own cache key.
  resolveHandle
    .calledWith([])
    .implement((...segments: unknown[]) => segments[segments.length - 1] ?? '');

  // Addressed by the file path the broker asks ESLint about; the ESLint instance's own cwd is not
  // part of that call, so a test that needs two different configs stages two different paths.
  return {
    returnsConfig: ({ filePath, config }): void => {
      eslint.calculateConfigForFileReturns({ filePath, config });
    },

    // ESLint answers null for a file its config ignores; the broker then walks its fallback paths
    // ('fallback.ts' under this proxy's last-segment `resolve`), each of which must be staged too.
    returnsNullConfig: ({ filePath }): void => {
      eslint.calculateConfigForFileReturns({ filePath, config: null });
    },

    throwsOnConstruction: ({ cwd: constructionCwd, error }): void => {
      eslint.constructionThrows({ cwd: constructionCwd, error });
    },

    throwsOnCalculate: ({ filePath, error }): void => {
      eslint.calculateConfigForFileRejects({ filePath, error });
    },

    getCalculatedFor: ({ filePath }): readonly unknown[][] =>
      eslint.getCalculateConfigForFileCallsFor({ filePath }),
  };
};
