/**
 * PURPOSE: Empty proxy for typescript-ast-to-module-mock-calls-adapter
 *
 * USAGE:
 * const proxy = typescriptAstToModuleMockCallsAdapterProxy();
 * // Empty proxy - TypeScript AST runs real in tests
 */

export const typescriptAstToModuleMockCallsAdapterProxy = (): Record<PropertyKey, never> => ({});
