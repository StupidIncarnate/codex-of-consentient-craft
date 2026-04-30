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
  pathResolveAdapterProxy();
  fsExistsSyncAdapterProxy();
  eslintFallbackPathsBrokerProxy();

  // Override the eslint adapter proxy's mock handle to provide test-specific behavior
  const eslintHandle = eslintProxy.getHandle();

  // Mock that returns different values based on cwd
  eslintHandle.mockImplementation((options: never) => {
    const opts = options as unknown as ConstructorParameters<typeof ESLint>[0];
    const cwdValue = opts?.cwd ?? '';

    if (cwdValue === '/error-test-1') {
      throw new Error('ESLint configuration error');
    }
    if (cwdValue === '/error-test-2') {
      throw new Error('Config calculation failed');
    }
    if (cwdValue === '/error-test-3') {
      throw new Error('Non-Error thrown');
    }

    const mockCalculateConfigForFile = jest.fn();

    if (cwdValue === '/null-config-test') {
      mockCalculateConfigForFile.mockResolvedValue(null);
    } else if (cwdValue === '/project') {
      mockCalculateConfigForFile.mockResolvedValue({
        rules: { 'no-unused-vars': 'error' },
      } as Linter.Config);
    } else if (cwdValue === '/test' || cwdValue === '/test1') {
      mockCalculateConfigForFile.mockResolvedValue({
        rules: { 'no-undef': 'error' },
      } as Linter.Config);
    } else if (cwdValue === '/test2') {
      mockCalculateConfigForFile.mockResolvedValue({
        rules: { 'no-console': 'warn' },
      } as Linter.Config);
    } else {
      mockCalculateConfigForFile.mockResolvedValue({
        rules: { 'no-console': 'warn' },
      } as Linter.Config);
    }

    return {
      calculateConfigForFile: mockCalculateConfigForFile,
    } as unknown as ESLint;
  });

  return {};
};
