/**
 * PURPOSE: Empty proxy for typescriptAstToLocalExportNamesAdapter
 *
 * USAGE:
 * const proxy = typescriptAstToLocalExportNamesAdapterProxy();
 * // Empty proxy - TypeScript AST operations run real in tests
 */

export const typescriptAstToLocalExportNamesAdapterProxy = (): Record<PropertyKey, never> => ({});
