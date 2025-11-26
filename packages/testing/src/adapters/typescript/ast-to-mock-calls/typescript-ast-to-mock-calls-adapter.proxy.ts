/**
 * PURPOSE: Empty proxy for typescript-ast-to-mock-calls-adapter
 *
 * USAGE:
 * const proxy = typescriptAstToMockCallsAdapterProxy();
 * // Empty proxy - TypeScript AST runs real in tests
 */

export const typescriptAstToMockCallsAdapterProxy = (): Record<PropertyKey, never> => ({});
