/**
 * PURPOSE: Proxy for eslint-fallback-paths-broker that sets up path resolution mocking
 *
 * USAGE:
 * const proxy = eslintFallbackPathsBrokerProxy();
 * const paths = eslintFallbackPathsBroker({ cwd: '/project/.test-tmp/foo' });
 */
import { resolve } from 'path';
import { pathResolveAdapterProxy } from '../../../adapters/path/resolve/path-resolve-adapter.proxy';

const actualPath: { resolve: typeof resolve } = jest.requireActual('path');

export const eslintFallbackPathsBrokerProxy = (): Record<PropertyKey, never> => {
  pathResolveAdapterProxy();

  // Restore real path.resolve behavior since this broker depends on actual path traversal
  jest.mocked(resolve).mockImplementation((...paths) => actualPath.resolve(...paths));

  return {};
};
