/**
 * PURPOSE: Wraps `jest.isolateModulesAsync` from `@jest/globals`'s own `jest` object — runs the
 * given async callback against a fresh, sandboxed module registry so a `doMock` inside it never
 * leaks into a require made outside the callback.
 *
 * USAGE:
 * await isolateModulesAsync({ fn: async () => {
 *   doMock({ moduleName: './config', factory: () => ({}) });
 *   await import('./entrypoint');
 * }});
 */
import { jest } from '@jest/globals';

export const isolateModulesAsync = async ({ fn }: { fn: () => Promise<void> }): Promise<void> =>
  jest.isolateModulesAsync(fn);
