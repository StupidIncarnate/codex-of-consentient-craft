/**
 * PURPOSE: Proxy for child-process-spawn-adapter providing test isolation
 *
 * USAGE:
 * const proxy = childProcessSpawnAdapterProxy();
 * // No mocks needed - adapter wraps Node.js built-in
 */

export const childProcessSpawnAdapterProxy = (): Record<PropertyKey, never> => ({});
