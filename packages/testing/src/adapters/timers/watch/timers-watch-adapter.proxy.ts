/**
 * PURPOSE: Proxy for timers-watch-adapter testing
 *
 * USAGE:
 * timersWatchAdapterProxy();
 * // The adapter wraps language primitives, so it runs REAL — mocking the timers it patches would
 * // leave the test asserting against the mock rather than against node's own handles
 */

export const timersWatchAdapterProxy = (): Record<PropertyKey, never> => ({});
