/**
 * PURPOSE: Empty proxy for typescript-source-file-getter-adapter
 *
 * USAGE:
 * const proxy = typescriptSourceFileGetterAdapterProxy();
 * // Empty proxy - TypeScript Program runs real in tests
 */

export const typescriptSourceFileGetterAdapterProxy = (): Record<PropertyKey, never> => ({});
