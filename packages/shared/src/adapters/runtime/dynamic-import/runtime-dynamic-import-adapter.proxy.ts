/**
 * PURPOSE: Proxy for runtime dynamic import adapter
 *
 * WHY MOCK ADAPTER: import() is a language primitive with no npm package to mock.
 * This is the only adapter that mocks itself rather than an underlying package.
 * The selective factory mock (registerMock with fn) replaces only runtimeDynamicImportAdapter
 * in the @dungeonmaster/shared/adapters barrel, preserving all other exports.
 *
 * USAGE:
 * const proxy = runtimeDynamicImportAdapterProxy();
 * proxy.succeeds({ path: '/path/to/module.ts', module: { StartServer: () => undefined } });
 */
import { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const runtimeDynamicImportAdapterProxy = (): {
  succeeds: ({ path, module }: { path: string; module: unknown }) => void;
  throws: ({ path, error }: { path: string; error: Error }) => void;
} => {
  const handle = registerMock({ fn: runtimeDynamicImportAdapter });

  return {
    // Keyed on the module specifier. calledWith()/resolves() match purely on the staged
    // arguments against every recorded call — unlike the old per-caller-file routing
    // (mockImplementation/mock.calls), they never need the real adapter file to appear on
    // the call stack, so they work correctly even though the selective factory mock
    // replaces runtimeDynamicImportAdapter directly in the barrel.
    // The real adapter's signature is `({ path }: { path: string })` — one object argument, not
    // a positional string — so the staged call must describe that same object shape or it never
    // matches a real caller's invocation (only this adapter's own self-import test bypasses the
    // mock entirely, which is why that gap stayed invisible until a cross-package caller used it).
    succeeds: ({ path, module }: { path: string; module: unknown }): void => {
      handle.calledWith([{ path }]).resolves(module);
    },
    throws: ({ path, error }: { path: string; error: Error }): void => {
      handle.calledWith([{ path }]).rejects(error);
    },
  };
};
