/**
 * PURPOSE: Proxy for runtime dynamic import adapter
 *
 * WHY MOCK ADAPTER: import() is a language primitive with no npm package to mock.
 * This is the only adapter that mocks itself rather than an underlying package.
 * Mocks barrel export for cross-package consumers.
 *
 * WHY registerModuleMock WITH FACTORY: The barrel @dungeonmaster/shared/adapters re-exports
 * many adapters (pathJoinAdapter, fsReaddirWithTypesAdapter, etc). Auto-mocking the entire
 * barrel would break all callers. The factory spreads jest.requireActual to preserve all
 * real exports and only replaces runtimeDynamicImportAdapter with a jest.fn().
 */
import { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

registerModuleMock({
  module: '@dungeonmaster/shared/adapters',
  factory: () => ({
    ...jest.requireActual('@dungeonmaster/shared/adapters'),
    runtimeDynamicImportAdapter: jest.fn(),
  }),
});

export const runtimeDynamicImportAdapterProxy = ({
  module,
}: {
  module: unknown;
}): Record<PropertyKey, never> => {
  // runtimeDynamicImportAdapter is a jest.fn() from the registerModuleMock factory
  const mock = runtimeDynamicImportAdapter as unknown as jest.MockedFunction<
    typeof runtimeDynamicImportAdapter
  >;
  if (module instanceof Error) {
    mock.mockImplementation(() => Promise.reject(module) as never);
  } else {
    mock.mockResolvedValue(module as never);
  }

  return {};
};
