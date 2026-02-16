/**
 * PURPOSE: Proxy for runtime dynamic import adapter
 *
 * WHY MOCK ADAPTER: import() is a language primitive with no npm package to mock.
 * This is the only adapter that mocks itself rather than an underlying package.
 * Mocks barrel export for cross-package consumers.
 *
 * WHY jest.mock INSIDE FUNCTION: Placing jest.mock at module level causes side effects
 * when this proxy is loaded via the testing barrel from compiled dist. The transformer
 * still extracts jest.mock from function bodies for hoisting into test files.
 */
import type { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';

export const runtimeDynamicImportAdapterProxy = ({
  module,
}: {
  module: unknown;
}): Record<PropertyKey, never> => {
  jest.mock('@dungeonmaster/shared/adapters', () => ({
    ...jest.requireActual('@dungeonmaster/shared/adapters'),
    runtimeDynamicImportAdapter: jest.fn(),
  }));

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
