/**
 * PURPOSE: Proxy for eslint-lint-run-targeted-broker that delegates to adapter proxies
 *
 * USAGE:
 * const proxy = eslintLintRunTargetedBrokerProxy();
 * const results = await eslintLintRunTargetedBroker({ content, filePath, config });
 */

import { eslintEslintAdapterProxy } from '../../../adapters/eslint/eslint/eslint-eslint-adapter.proxy';
import { pathResolveAdapterProxy } from '../../../adapters/path/resolve/path-resolve-adapter.proxy';

export const eslintLintRunTargetedBrokerProxy = (): {
  setupLintResults: (params: { oldResults: unknown[]; newResults: unknown[] }) => void;
  returnsLintResults: (params: { results: unknown[] }) => void;
} => {
  const eslintProxy = eslintEslintAdapterProxy();
  pathResolveAdapterProxy();

  return {
    setupLintResults: ({
      oldResults,
      newResults,
    }: {
      oldResults: unknown[];
      newResults: unknown[];
    }): void => {
      const mockLintText = eslintProxy.getMockLintText();

      // Reset mock and set up to return different results on each call
      mockLintText.mockReset();
      mockLintText.mockResolvedValueOnce(oldResults);
      mockLintText.mockResolvedValueOnce(newResults);

      // Set default for any additional calls
      mockLintText.mockResolvedValue(newResults);
    },

    returnsLintResults: ({ results }: { results: unknown[] }): void => {
      const mockLintText = eslintProxy.getMockLintText();

      // Set up single call to return specific results
      mockLintText.mockReset();
      mockLintText.mockResolvedValue(results);
    },
  };
};
