/**
 * PURPOSE: Proxy for runtime dynamic import adapter
 *
 * WHY MOCK ADAPTER: import() is a language primitive with no npm package to mock.
 * This is the only adapter that mocks itself rather than an underlying package.
 * Mocks barrel export for cross-package consumers.
 *
 * WHY jest.mock AT MODULE LEVEL: The proxy-mock-transformer only extracts module-level
 * jest.mock() calls for hoisting into test files. Placing jest.mock inside a function
 * body means it never gets hoisted, so the real adapter runs and causes side effects
 * (e.g., actually importing @dungeonmaster/server and starting a real HTTP server).
 */
import type { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';

jest.mock('@dungeonmaster/shared/adapters', () => ({
  ...jest.requireActual('@dungeonmaster/shared/adapters'),
  runtimeDynamicImportAdapter: jest.fn(),
}));

export const runtimeDynamicImportAdapterProxy = ({
  module,
}: {
  module: unknown;
}): Record<PropertyKey, never> => {
  const adapters = jest.requireMock<{
    runtimeDynamicImportAdapter: typeof runtimeDynamicImportAdapter;
  }>('@dungeonmaster/shared/adapters');
  const mock = jest.mocked(adapters.runtimeDynamicImportAdapter<unknown>);
  if (module instanceof Error) {
    mock.mockRejectedValue(module);
  } else {
    mock.mockResolvedValue(module);
  }

  return {};
};
