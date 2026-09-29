/**
 * PURPOSE: Declares a module-level jest.mock() that the AST transformer hoists with an optional factory
 *
 * USAGE:
 * registerModuleMock({ module: 'eslint-plugin-jest', factory: () => ({ default: { rules: {} } }) });
 * // AST transformer generates: jest.mock('eslint-plugin-jest', () => ({ default: { rules: {} } }))
 *
 * WHEN-TO-USE: When a module must be replaced before import to prevent side-effect crashes
 * WHEN-NOT-TO-USE: When mocking individual exported functions (use registerMock instead)
 */

// Runtime no-op: `astModuleMockCallsTransformer` recognizes `registerModuleMock({ module })` calls by
// name and the proxy-mock hoister emits them as `jest.mock()`; the hoisted call does the mocking.
export const moduleMockRegisterMiddleware = ({
  module: _module,
  factory: _factory,
}: {
  module: string;
  // `unknown`, not an object shape: a module's export can be any value — Electron's
  // Node-context export is a bare path string, not a record.
  factory?: () => unknown;
}): void => undefined;
