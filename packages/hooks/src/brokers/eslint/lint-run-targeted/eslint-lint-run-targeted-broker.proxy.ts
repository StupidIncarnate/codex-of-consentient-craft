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
      const lintTextHandler = eslintProxy.getLintTextHandler();

      // Reset mock and set up to return different results on each call
      lintTextHandler.mockReset();
      lintTextHandler.mockResolvedValueOnce(oldResults);
      lintTextHandler.mockResolvedValueOnce(newResults);

      // Set default for any additional calls
      lintTextHandler.mockResolvedValue(newResults);
    },

    returnsLintResults: ({ results }: { results: unknown[] }): void => {
      const lintTextHandler = eslintProxy.getLintTextHandler();

      // Set up single call to return specific results
      lintTextHandler.mockReset();
      lintTextHandler.mockResolvedValue(results);
    },
  };
};
