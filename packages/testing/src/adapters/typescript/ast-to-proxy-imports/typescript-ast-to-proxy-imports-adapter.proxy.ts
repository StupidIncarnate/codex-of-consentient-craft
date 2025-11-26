/**
 * PURPOSE: Empty proxy for typescript-ast-to-proxy-imports-adapter
 *
 * USAGE:
 * const proxy = typescriptAstToProxyImportsAdapterProxy();
 * // Empty proxy - TypeScript AST runs real in tests
 */

export const typescriptAstToProxyImportsAdapterProxy = (): Record<PropertyKey, never> => ({});
