/**
 * PURPOSE: Proxy for runtime dynamic import adapter
 *
 * WHY MOCK ADAPTER: import() is a language primitive with no npm package to mock.
 * This is the only adapter that mocks itself rather than an underlying package.
 * Mocks barrel export for cross-package consumers.
 */
import { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';

jest.mock('@dungeonmaster/shared/adapters', () => ({
  ...jest.requireActual('@dungeonmaster/shared/adapters'),
  runtimeDynamicImportAdapter: jest.fn(),
}));

export const runtimeDynamicImportAdapterProxy = ({
  module,
}: {
  module: unknown;
}): Record<PropertyKey, never> => {
  const mock = jest.mocked(runtimeDynamicImportAdapter<unknown>);
  if (module instanceof Error) {
    mock.mockRejectedValue(module);
  } else {
    mock.mockResolvedValue(module);
  }

  return {};
};
