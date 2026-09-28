/**
 * PURPOSE: Proxy for eslint-is-path-ignored-broker that controls the ignored result
 *
 * USAGE:
 * const proxy = eslintIsPathIgnoredBrokerProxy();
 * proxy.setIgnored({ filePath: 'x.ts', ignored: true });
 * const ignored = await eslintIsPathIgnoredBroker({ cwd: '/project', filePath: 'x.ts' });
 */
import { ESLint } from '#gateway/npm/eslint';
import { resolve } from '#gateway/node/path';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { cwd } from '#gateway/node/process';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
} from '@dungeonmaster/testing/register-mock';

registerModuleMock({ module: '#gateway/npm/eslint' });

export const eslintIsPathIgnoredBrokerProxy = (): {
  setIgnored: (params: {
    filePath: string | ((value: unknown) => boolean);
    ignored: boolean;
  }) => void;
  setIgnoredForDefaultCwd: (params: { filePath: string; ignored: boolean }) => void;
} => {
  cwdProxy();
  // cwdProxy() itself stages nothing (the gateway wrapper offers no staging surface), so the
  // no-cwd branch is staged directly on the gateway function it calls — a fixed address, not
  // the real process.cwd(), so a test built on it never depends on where jest runs.
  const cwdHandle = registerMock({ fn: cwd });
  cwdHandle.calledWith([]).returns('/default/cwd');
  const resolveHandle = registerMock({ fn: resolve });

  // This broker's own resolve call needs an explicit fallback. Restore
  // "return the last segment" — i.e. resolve(cwd, filePath) => filePath — locally, scoped to this
  // proxy, so the raw filePath the broker was called with is what isPathIgnored actually receives.
  resolveHandle
    .calledWith([])
    .implement((...segments: unknown[]) => segments[segments.length - 1] ?? '');

  const isPathIgnoredHandle = registerSpyOn({
    object: ESLint.prototype,
    method: 'isPathIgnored',
  });

  return {
    // Callers that don't know filePath ahead of setup (e.g. a proxy composing this one before its
    // own test constructs a tool input) pass a predicate.
    setIgnored: ({ filePath, ignored }): void => {
      isPathIgnoredHandle.calledWith([filePath]).resolves(ignored);
    },

    // Addressed by the staged '/default/cwd' rather than the `resolve(...)` catch-all above
    // (which returns filePath unchanged regardless of cwd) — this is what a caller that omits
    // `cwd` actually resolves against, so a broker that stops calling cwd() on that branch fails
    // whatever test stages this.
    setIgnoredForDefaultCwd: ({ filePath, ignored }): void => {
      const resolvedForDefaultCwd = `/default/cwd/resolved/${filePath}`;
      resolveHandle.calledWith(['/default/cwd', filePath]).returns(resolvedForDefaultCwd);
      isPathIgnoredHandle.calledWith([resolvedForDefaultCwd]).resolves(ignored);
    },
  };
};
