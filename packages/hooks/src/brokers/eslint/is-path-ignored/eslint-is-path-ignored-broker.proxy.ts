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
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const eslintIsPathIgnoredBrokerProxy = (): {
  setIgnored: (params: {
    filePath: string | ((value: unknown) => boolean);
    ignored: boolean;
  }) => void;
  setIgnoredForDefaultCwd: (params: { filePath: string; ignored: boolean }) => void;
  setLookupThrows: (params: { filePath: string; error: Error }) => void;
  getCheckedPathsFor: (params: { filePath: string }) => readonly unknown[][];
} => {
  const cwd = cwdProxy();
  // A fixed address, not the real process.cwd(), so a test never depends on where jest runs.
  // Staged inside each setup method, so every test that reaches the no-cwd branch calls one.
  const defaultCwd = '/default/cwd';
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
      cwd.setupCwd({ value: defaultCwd });
      eslint.isPathIgnoredReturns({ filePath, ignored });
    },

    // Addressed by the staged '/default/cwd' rather than the `resolve(...)` catch-all above
    // (which returns filePath unchanged regardless of cwd) — this is what a caller that omits
    // `cwd` actually resolves against, so a broker that stops calling cwd() on that branch fails
    // whatever test stages this.
    setIgnoredForDefaultCwd: ({ filePath, ignored }): void => {
      cwd.setupCwd({ value: defaultCwd });
      const resolvedForDefaultCwd = `${defaultCwd}/resolved/${filePath}`;
      resolveHandle.calledWith([defaultCwd, filePath]).returns(resolvedForDefaultCwd);
      eslint.isPathIgnoredReturns({ filePath: resolvedForDefaultCwd, ignored });
    },

    // ESLint throws for a path outside its cwd; the broker's catch answers "not ignored".
    setLookupThrows: ({ filePath, error }): void => {
      cwd.setupCwd({ value: defaultCwd });
      eslint.isPathIgnoredRejects({ filePath, error });
    },

    // What the broker really asked ESLint about: the resolved absolute path it passed.
    getCheckedPathsFor: ({ filePath }): readonly unknown[][] =>
      eslint.getIsPathIgnoredCallsFor({ filePath }),
  };
};
