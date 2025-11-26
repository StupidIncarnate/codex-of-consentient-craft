/**
 * PURPOSE: Empty proxy for path-resolve-adapter
 *
 * USAGE:
 * const proxy = pathResolveAdapterProxy();
 * // Empty proxy - path.resolve runs real in tests
 */

export const pathResolveAdapterProxy = (): Record<PropertyKey, never> => ({});
