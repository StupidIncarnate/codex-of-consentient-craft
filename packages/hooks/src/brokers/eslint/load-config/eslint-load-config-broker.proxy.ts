/**
 * PURPOSE: Proxy for eslint-load-config-broker that resets cache and delegates to adapter proxy
 *
 * USAGE:
 * const proxy = eslintLoadConfigBrokerProxy();
 * const config = await eslintLoadConfigBroker({ cwd: '/project/path', filePath: 'src/file.ts' });
 */

import * as eslintGateway from '#gateway/npm/eslint';
import { ESLint, type Linter } from '#gateway/npm/eslint';
import { resolve } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { eslintFallbackPathsBrokerProxy } from '../fallback-paths/eslint-fallback-paths-broker.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { cwd } from '#gateway/node/process';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
} from '@dungeonmaster/testing/register-mock';

registerModuleMock({ module: '#gateway/npm/eslint' });

export const eslintLoadConfigBrokerProxy = (): Record<PropertyKey, never> => {
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

  for (const configName of locationsStatics.repoRoot.eslintConfig) {
    existsProxy.returns({ path: configName, exists: false });
  }

  const eslintInstanceReturning = (config: Linter.Config | null): ESLint => {
    const mockCalculateConfigForFile = jest.fn();

    mockCalculateConfigForFile.mockResolvedValue(config);

    return Object.assign(Object.create(ESLint.prototype), {
      calculateConfigForFile: mockCalculateConfigForFile,
    }) as ESLint;
  };

  // This broker uses the resolved cwd as a Map cache key across the module-level configCache, so
  // a fixed placeholder here would collapse every test's cwd onto one cache entry and leak
  // results between tests. Restore "return the last segment" — i.e. resolve(cwd) => cwd, and
  // resolve(dir, configName) => configName — locally, scoped to this proxy, so each test's cwd
  // still produces its own cache key.
  resolveHandle
    .calledWith([])
    .implement((...segments: unknown[]) => segments[segments.length - 1] ?? '');

  const constructorHandle = registerSpyOn({
    object: eslintGateway,
    method: 'ESLint',
  });

  // Registered first (lowest priority): any cwd this proxy doesn't special-case, including the
  // default cwd from cwd(). A function matcher scores the same as the
  // more specific `{cwd: X}` object matchers below, so registering it FIRST lets the specific
  // stagings win ties by "later registration wins" — order-independent of what any OTHER eslint
  // broker proxy registers on eslintEslintAdapterProxy's own `calledWith([])` default, since a
  // function/object match always outscores an empty-array match regardless of order.
  constructorHandle
    .calledWith([(options: unknown) => typeof options === 'object' && options !== null])
    .implement(() => eslintInstanceReturning({ rules: { 'no-console': 'warn' } } as Linter.Config));

  constructorHandle.calledWith([{ cwd: '/error-test-1' }]).implement(() => {
    throw new Error('ESLint configuration error');
  });
  constructorHandle.calledWith([{ cwd: '/error-test-2' }]).implement(() => {
    throw new Error('Config calculation failed');
  });
  constructorHandle.calledWith([{ cwd: '/error-test-3' }]).implement(() => {
    throw new Error('Non-Error thrown');
  });
  constructorHandle
    .calledWith([{ cwd: '/null-config-test' }])
    .implement(() => eslintInstanceReturning(null));
  constructorHandle
    .calledWith([{ cwd: '/project' }])
    .implement(() =>
      eslintInstanceReturning({ rules: { 'no-unused-vars': 'error' } } as Linter.Config),
    );
  constructorHandle
    .calledWith([{ cwd: '/test' }])
    .implement(() => eslintInstanceReturning({ rules: { 'no-undef': 'error' } } as Linter.Config));
  constructorHandle
    .calledWith([{ cwd: '/test1' }])
    .implement(() => eslintInstanceReturning({ rules: { 'no-undef': 'error' } } as Linter.Config));

  // Keyed on the staged '/default/cwd' address specifically, scoring above the any-object
  // catch-all above — this is what a caller that omits `cwd` actually constructs ESLint with, so
  // a broker that stops calling cwd() on that branch fails whatever test asserts on this.
  constructorHandle
    .calledWith([{ cwd: '/default/cwd' }])
    .implement(() =>
      eslintInstanceReturning({ rules: { 'default-cwd-marker': 'error' } } as Linter.Config),
    );

  return {};
};
