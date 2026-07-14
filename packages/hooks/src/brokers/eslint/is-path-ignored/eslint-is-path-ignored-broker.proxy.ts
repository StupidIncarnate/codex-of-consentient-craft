/**
 * PURPOSE: Proxy for eslint-is-path-ignored-broker that controls the ignored result
 *
 * USAGE:
 * const proxy = eslintIsPathIgnoredBrokerProxy();
 * proxy.setIgnored({ ignored: true });
 * const ignored = await eslintIsPathIgnoredBroker({ cwd: '/project', filePath: 'x.ts' });
 */
import { eslintEslintAdapterProxy } from '../../../adapters/eslint/eslint/eslint-eslint-adapter.proxy';
import { eslintIsPathIgnoredAdapterProxy } from '../../../adapters/eslint/is-path-ignored/eslint-is-path-ignored-adapter.proxy';
import { pathResolveAdapterProxy } from '../../../adapters/path/resolve/path-resolve-adapter.proxy';
import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';

export const eslintIsPathIgnoredBrokerProxy = (): {
  setIgnored: (params: { ignored: boolean }) => void;
} => {
  processCwdAdapterProxy();
  const eslintProxy = eslintEslintAdapterProxy();
  eslintIsPathIgnoredAdapterProxy();
  pathResolveAdapterProxy();

  const isPathIgnoredHandle = eslintProxy.getIsPathIgnoredHandler();

  return {
    setIgnored: ({ ignored }: { ignored: boolean }): void => {
      isPathIgnoredHandle.mockResolvedValue(ignored);
    },
  };
};
