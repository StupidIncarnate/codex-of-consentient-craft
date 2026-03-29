/**
 * PURPOSE: Proxy for runtime dynamic import adapter
 *
 * WHY MOCK ADAPTER: import() is a language primitive with no npm package to mock.
 * This is the only adapter that mocks itself rather than an underlying package.
 * The selective factory mock (registerMock with fn) replaces only runtimeDynamicImportAdapter
 * in the @dungeonmaster/shared/adapters barrel, preserving all other exports.
 */
import { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';
import { registerMock } from '@dungeonmaster/testing/register-mock';

const handle = registerMock({ fn: runtimeDynamicImportAdapter });

export const runtimeDynamicImportAdapterProxy = ({
  module,
}: {
  module: unknown;
}): Record<PropertyKey, never> => {
  if (module instanceof Error) {
    handle.mockImplementation(() => Promise.reject(module) as never);
  } else {
    handle.mockResolvedValue(module as never);
  }

  return {};
};
