/**
 * PURPOSE: Proxy for eslint-is-path-ignored-broker that controls the ignored result
 *
 * USAGE:
 * const proxy = eslintIsPathIgnoredBrokerProxy();
 * proxy.setIgnored({ filePath: 'x.ts', ignored: true });
 * const ignored = await eslintIsPathIgnoredBroker({ cwd: '/project', filePath: 'x.ts' });
 */
import { eslintEslintAdapterProxy } from '../../../adapters/eslint/eslint/eslint-eslint-adapter.proxy';
import { eslintIsPathIgnoredAdapterProxy } from '../../../adapters/eslint/is-path-ignored/eslint-is-path-ignored-adapter.proxy';
import { pathResolveAdapterProxy } from '../../../adapters/path/resolve/path-resolve-adapter.proxy';
import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';

export const eslintIsPathIgnoredBrokerProxy = (): {
  setIgnored: (params: {
    filePath: string | ((value: unknown) => boolean);
    ignored: boolean;
  }) => void;
} => {
  processCwdAdapterProxy();
  const eslintProxy = eslintEslintAdapterProxy();
  eslintIsPathIgnoredAdapterProxy();
  const resolveProxy = pathResolveAdapterProxy();

  // pathResolveAdapterProxy no longer has a global default (converted to argument-addressed
  // staging), so this broker's own pathResolveAdapter call needs an explicit fallback. Restore
  // "return the last segment" — i.e. resolve(cwd, filePath) => filePath — locally, scoped to this
  // proxy, so the raw filePath the broker was called with is what isPathIgnored actually receives.
  resolveProxy
    .getHandle()
    .calledWith([])
    .implement((...segments: unknown[]) => segments[segments.length - 1] ?? '');

  const isPathIgnoredHandle = eslintProxy.getIsPathIgnoredHandle();

  return {
    // Callers that don't know filePath ahead of setup (e.g. a proxy composing this one before its
    // own test constructs a tool input) pass a predicate.
    setIgnored: ({ filePath, ignored }): void => {
      isPathIgnoredHandle.calledWith([filePath]).resolves(ignored);
    },
  };
};
