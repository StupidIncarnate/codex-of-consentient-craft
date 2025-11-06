/**
 * PURPOSE: Proxy for eslint-lint-run-targeted-broker that mocks ESLint adapter
 *
 * USAGE:
 * const proxy = eslintLintRunTargetedBrokerProxy();
 * proxy.setupLintResults({ results: [{ filePath: '/test.ts', messages: [] }] });
 * const results = await eslintLintRunTargetedBroker({ content, filePath, config });
 */

import { eslintEslintAdapter } from '../../../adapters/eslint/eslint/eslint-eslint-adapter';
import type { ESLint } from 'eslint';

jest.mock('../../../adapters/eslint/eslint/eslint-eslint-adapter');

const mockEslintEslintAdapter = jest.mocked(eslintEslintAdapter);

export const eslintLintRunTargetedBrokerProxy = (): {
  setupLintResults: (params: { results: ESLint.LintResult[] }) => void;
  setupLintError: (params: { error: Error }) => void;
  setupProjectError: (params: {
    firstResults: ESLint.LintResult[];
    fallbackResults: ESLint.LintResult[];
  }) => void;
} => {
  return {
    setupLintResults: ({ results }: { results: ESLint.LintResult[] }): void => {
      const mockLintText = jest.fn().mockResolvedValue(results);
      const mockESLintInstance = {
        lintText: mockLintText,
        lintFiles: jest.fn(),
        getRulesMetaForResults: jest.fn(),
        calculateConfigForFile: jest.fn(),
        isPathIgnored: jest.fn(),
        loadFormatter: jest.fn(),
        hasFlag: jest.fn(),
        findConfigFile: jest.fn(),
      } satisfies ESLint;

      mockEslintEslintAdapter.mockReturnValue(mockESLintInstance);
    },

    setupLintError: ({ error }: { error: Error }): void => {
      mockEslintEslintAdapter.mockImplementation(() => {
        throw error;
      });
    },

    setupProjectError: ({
      firstResults,
      fallbackResults,
    }: {
      firstResults: ESLint.LintResult[];
      fallbackResults: ESLint.LintResult[];
    }): void => {
      const mockLintTextFirst = jest.fn().mockResolvedValue(firstResults);
      const mockLintTextSecond = jest.fn().mockResolvedValue(fallbackResults);

      mockEslintEslintAdapter
        .mockReturnValueOnce({
          lintText: mockLintTextFirst,
          lintFiles: jest.fn(),
          getRulesMetaForResults: jest.fn(),
          calculateConfigForFile: jest.fn(),
          isPathIgnored: jest.fn(),
          loadFormatter: jest.fn(),
          hasFlag: jest.fn(),
          findConfigFile: jest.fn(),
        } satisfies ESLint)
        .mockReturnValueOnce({
          lintText: mockLintTextSecond,
          lintFiles: jest.fn(),
          getRulesMetaForResults: jest.fn(),
          calculateConfigForFile: jest.fn(),
          isPathIgnored: jest.fn(),
          loadFormatter: jest.fn(),
          hasFlag: jest.fn(),
          findConfigFile: jest.fn(),
        } satisfies ESLint);
    },
  };
};
