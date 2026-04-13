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

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

/**
 * Runtime no-op — the AST transformer in typescript-ast-to-mock-calls-adapter.ts
 * recognizes registerModuleMock({ module: '...' }) calls and hoists them as jest.mock().
 * The actual mocking is done by the hoisted jest.mock(), not by this function.
 */
export const jestRegisterModuleMockAdapter = ({
  module: _module,
  factory: _factory,
}: {
  module: string;
  factory?: () => Record<PropertyKey, unknown>;
}): AdapterResult =>
  // Intentionally empty — jest.mock() is hoisted by the AST transformer

  ({ success: true as const });
