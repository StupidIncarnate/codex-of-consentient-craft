/**
 * PURPOSE: Proxy for runtime dynamic import adapter
 *
 * WHY MOCK ADAPTER: import() is a language primitive with no npm package to mock.
 * This is the only adapter that mocks itself rather than an underlying package.
 * The selective factory mock (registerMock with fn) replaces only runtimeDynamicImportAdapter
 * in the @dungeonmaster/shared/adapters barrel, preserving all other exports.
 *
 * WHY DIRECT MOCK: registerMock's stack-based routing cannot match this adapter because
 * the selective jest.mock factory replaces the function directly — the adapter filename
 * never appears in the call stack when invoked through the barrel. We keep registerMock
 * at module level so the AST transformer still generates the jest.mock() call, then
 * set mock values directly on the jest.fn() to bypass stack routing.
 */
import { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// Triggers AST transformer to generate jest.mock('@dungeonmaster/shared/adapters', factory)
registerMock({ fn: runtimeDynamicImportAdapter });

export const runtimeDynamicImportAdapterProxy = ({
  module,
}: {
  module: unknown;
}): Record<PropertyKey, never> => {
  const mock = runtimeDynamicImportAdapter as unknown as jest.Mock;

  if (module instanceof Error) {
    mock.mockRejectedValue(module);
  } else {
    mock.mockResolvedValue(module);
  }

  return {};
};
