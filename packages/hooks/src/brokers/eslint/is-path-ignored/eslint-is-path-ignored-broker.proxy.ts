/**
 * PURPOSE: Proxy for eslint-is-path-ignored-broker that controls the ignored result
 *
 * USAGE:
 * const proxy = eslintIsPathIgnoredBrokerProxy();
 * proxy.setIgnored({ filePath: 'x.ts', ignored: true });
 * const ignored = await eslintIsPathIgnoredBroker({ cwd: '/project', filePath: 'x.ts' });
 */
import { ESLintProxy } from '#gateway/npm/eslint/eslint/eslint.proxy';
import { resolve } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const eslintIsPathIgnoredBrokerProxy = (): {
  setIgnored: (params: {
    filePath: string | ((value: unknown) => boolean);
    ignored: boolean;
  }) => void;
  setLookupThrows: (params: { filePath: string; error: Error }) => void;
  getCheckedPathsFor: (params: { filePath: string }) => readonly unknown[][];
} => {
  const resolveHandle = registerMock({ fn: resolve });

  // This broker's own resolve call needs an explicit fallback. Restore
  // "return the last segment" — i.e. resolve(cwd, filePath) => filePath — locally, scoped to this
  // proxy, so the raw filePath the broker was called with is what isPathIgnored actually receives.
  resolveHandle
    .calledWith([])
    .implement((...segments: unknown[]) => segments[segments.length - 1] ?? '');

  const eslint = ESLintProxy();

  return {
    // Callers that don't know filePath ahead of setup (e.g. a proxy composing this one before its
    // own test constructs a tool input) pass a predicate.
    setIgnored: ({ filePath, ignored }): void => {
      eslint.isPathIgnoredReturns({ filePath, ignored });
    },

    // ESLint throws for a path outside its cwd; the broker's catch answers "not ignored".
    setLookupThrows: ({ filePath, error }): void => {
      eslint.isPathIgnoredRejects({ filePath, error });
    },

    // What the broker really asked ESLint about: the resolved absolute path it passed.
    getCheckedPathsFor: ({ filePath }): readonly unknown[][] =>
      eslint.getIsPathIgnoredCallsFor({ filePath }),
  };
};
