/**
 * PURPOSE: Proxy for eslint-load-config-broker that resets cache and delegates to adapter proxy
 *
 * USAGE:
 * const proxy = eslintLoadConfigBrokerProxy();
 * const config = await eslintLoadConfigBroker({ cwd: '/project/path', filePath: 'src/file.ts' });
 */

import type { Linter } from 'eslint';

import type { ESLint } from 'eslint';
import { eslintEslintAdapterProxy } from '../../../adapters/eslint/eslint/eslint-eslint-adapter.proxy';
import { eslintCalculateConfigForFileAdapterProxy } from '../../../adapters/eslint/calculate-config-for-file/eslint-calculate-config-for-file-adapter.proxy';
import { pathResolveAdapterProxy } from '../../../adapters/path/resolve/path-resolve-adapter.proxy';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { eslintFallbackPathsBrokerProxy } from '../fallback-paths/eslint-fallback-paths-broker.proxy';
import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';

export const eslintLoadConfigBrokerProxy = (): Record<PropertyKey, never> => {
  // Create child proxies
  processCwdAdapterProxy();
  const eslintProxy = eslintEslintAdapterProxy();
  eslintCalculateConfigForFileAdapterProxy();
  const resolveProxy = pathResolveAdapterProxy();
  fsExistsSyncAdapterProxy();
  eslintFallbackPathsBrokerProxy();

  // Built from the SHARED fake instance (not a bare {calculateConfigForFile} object): a composed
  // test can construct ESLint through more than one broker with the same bare {cwd} options (e.g.
  // violations-check-new-broker.proxy.ts composes eslintIsPathIgnoredBrokerProxy alongside this
  // one), so this cwd-keyed override can end up answering a construction call that isn't
  // load-config's own. Keeping lintText/lintFiles/isPathIgnored wired to the shared instance means
  // that sibling broker still works; only calculateConfigForFile is swapped for this cwd's config.
  const eslintInstanceReturning = (config: Linter.Config | null): ESLint => {
    const mockCalculateConfigForFile = jest.fn();

    mockCalculateConfigForFile.mockResolvedValue(config);

    const sharedInstance = eslintProxy.getSharedInstance();

    // Forwarding arrow functions rather than direct method references — referencing
    // sharedInstance.lintText etc. directly would be an unbound method reference, and assigned
    // onto the shared instance's own prototype chain rather than spread, since spreading a class
    // instance copies its own properties onto a plain object and loses the prototype.
    return Object.assign(Object.create(Object.getPrototypeOf(sharedInstance) as object), {
      lintText: async (...args: Parameters<ESLint['lintText']>) => sharedInstance.lintText(...args),
      lintFiles: async (...args: Parameters<ESLint['lintFiles']>) =>
        sharedInstance.lintFiles(...args),
      isPathIgnored: async (...args: Parameters<ESLint['isPathIgnored']>) =>
        sharedInstance.isPathIgnored(...args),
      calculateConfigForFile: mockCalculateConfigForFile,
    }) as ESLint;
  };

  // pathResolveAdapterProxy no longer carries a global default (it's argument-addressed now).
  // This broker uses the resolved cwd as a Map cache key across the module-level configCache, so
  // a fixed placeholder here would collapse every test's cwd onto one cache entry and leak
  // results between tests. Restore "return the last segment" — i.e. resolve(cwd) => cwd, and
  // resolve(dir, configName) => configName — locally, scoped to this proxy, so each test's cwd
  // still produces its own cache key.
  resolveProxy
    .getHandle()
    .calledWith([])
    .implement((...segments: unknown[]) => segments[segments.length - 1] ?? '');

  // Override the eslint adapter proxy's constructor mock: this broker's tests dispatch entirely
  // by the cwd the broker constructs ESLint with, replacing the whole instance (not just
  // calculateConfigForFile) per cwd, so they stage directly on the constructor handle rather than
  // going through eslintEslintAdapterProxy's shared instance.
  const constructorHandle = eslintProxy.getConstructorHandle();

  // Registered first (lowest priority): any cwd this proxy doesn't special-case, including the
  // mocked processCwdAdapter default of '/default/cwd'. A function matcher scores the same as the
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

  return {};
};
