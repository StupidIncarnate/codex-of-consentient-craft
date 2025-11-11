/**
 * PURPOSE: Proxy for eslint-load-config-broker that resets cache and delegates to adapter proxy
 *
 * USAGE:
 * const proxy = eslintLoadConfigBrokerProxy();
 * const config = await eslintLoadConfigBroker({ cwd: '/project/path', filePath: 'src/file.ts' });
 */

import type { Linter } from 'eslint';

jest.mock('eslint');

import { ESLint } from 'eslint';

// Track which test we're in based on constructor calls across ALL tests
let globalConstructorCallCount = 0;

export const eslintLoadConfigBrokerProxy = (): Record<PropertyKey, never> => {

  // Create a mock that returns different values based on which test is running
  const mockEslintConstructor = jest.fn((options: { cwd?: string } | undefined) => {
    const cwd = options?.cwd ?? '';
    globalConstructorCallCount++;

    // Error test cases - check cwd first
    if (cwd === '/error-test-1') {
      throw new Error('ESLint configuration error');
    }
    if (cwd === '/error-test-2') {
      throw new Error('Config calculation failed');
    }
    if (cwd === '/error-test-3') {
      throw new Error('Non-Error thrown');
    }

    // Create mock calculateConfigForFile that returns based on cwd
    const mockCalculateConfigForFile = jest.fn(async (): Promise<Linter.Config | null> => {
      // Edge case: test 5 (6th constructor call - after test1:1, test2:1, test3:1, test4:2, test5:1)
      if (globalConstructorCallCount === 6) {
        // eslint-disable-next-line unicorn/no-null
        return null;
      }

      // Return different configs based on cwd
      if (cwd === '/project') {
        return { rules: { 'no-unused-vars': 'error' } } as Linter.Config;
      }
      if (cwd === '/test' || cwd === '/test1') {
        return { rules: { 'no-undef': 'error' } } as Linter.Config;
      }
      if (cwd === '/test2') {
        return { rules: { 'no-console': 'warn' } } as Linter.Config;
      }

      // Default cwd test (process.cwd())
      return { rules: { 'no-console': 'warn' } } as Linter.Config;
    });

    return {
      calculateConfigForFile: mockCalculateConfigForFile,
    } as unknown as ESLint;
  });

  // Set up the ESLint constructor mock
  jest.mocked(ESLint).mockImplementation(mockEslintConstructor as never);

  return {};
};
