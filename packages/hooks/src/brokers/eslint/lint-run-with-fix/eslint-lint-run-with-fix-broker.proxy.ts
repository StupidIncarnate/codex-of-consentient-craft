/**
 * PURPOSE: Proxy for eslint-lint-run-with-fix-broker that delegates to adapter proxies
 *
 * USAGE:
 * const proxy = eslintLintRunWithFixBrokerProxy();
 * proxy.returnsLintResults({ results: [...] });
 * const results = await eslintLintRunWithFixBroker({ filePath, config, cwd });
 */

import { eslintEslintAdapterProxy } from '../../../adapters/eslint/eslint/eslint-eslint-adapter.proxy';
import { pathResolveAdapterProxy } from '../../../adapters/path/resolve/path-resolve-adapter.proxy';

export const eslintLintRunWithFixBrokerProxy = (): {
  returnsLintResults: (params: { results: unknown[] }) => void;
} => {
  const eslintProxy = eslintEslintAdapterProxy();
  pathResolveAdapterProxy();

  return {
    returnsLintResults: ({ results }: { results: unknown[] }): void => {
      const lintFilesHandler = eslintProxy.getLintFilesHandler();

      // Set up to return specific results
      lintFilesHandler.mockReset();
      lintFilesHandler.mockResolvedValue(results);
    },
  };
};
