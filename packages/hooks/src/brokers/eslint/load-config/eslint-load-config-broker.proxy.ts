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
import { eslintFallbackPathsBrokerProxy } from '../fallback-paths/eslint-fallback-paths-broker.proxy';
import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';

const EDGE_CASE_TEST_CONSTRUCTOR_CALL_COUNT = 6;

// Track which test we're in based on constructor calls across ALL tests
const globalState = { constructorCallCount: 0 };

export const eslintLoadConfigBrokerProxy = (): Record<PropertyKey, never> => {
  // Create child proxies
  processCwdAdapterProxy();
  const eslintProxy = eslintEslintAdapterProxy();
  eslintCalculateConfigForFileAdapterProxy();
  pathResolveAdapterProxy();
  eslintFallbackPathsBrokerProxy();

  // Override the eslint adapter proxy's mock handle to provide test-specific behavior
  const eslintHandle = eslintProxy.getHandle();

  // Create a mock that returns different values based on which test is running
  eslintHandle.mockImplementation((options: never) => {
    const opts = options as unknown as ConstructorParameters<typeof ESLint>[0];
    const cwdValue = opts?.cwd ?? '';
    globalState.constructorCallCount += 1;

    // Error test cases - check cwd first
    if (cwdValue === '/error-test-1') {
      throw new Error('ESLint configuration error');
    }
    if (cwdValue === '/error-test-2') {
      throw new Error('Config calculation failed');
    }
    if (cwdValue === '/error-test-3') {
      throw new Error('Non-Error thrown');
    }

    // Create mock calculateConfigForFile that returns based on cwd
    const mockCalculateConfigForFile = jest.fn();

    // Edge case: test 5 (6th constructor call - after test1:1, test2:1, test3:1, test4:2, test5:1)
    if (globalState.constructorCallCount === EDGE_CASE_TEST_CONSTRUCTOR_CALL_COUNT) {
      mockCalculateConfigForFile.mockResolvedValue(null);
    } else if (cwdValue === '/project') {
      // Return different configs based on cwd
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
      // Default cwd test (process.cwd())
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
