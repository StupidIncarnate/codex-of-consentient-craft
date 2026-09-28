/**
 * PURPOSE: Proxy for timers-watch-broker testing
 *
 * USAGE:
 * timersWatchBrokerProxy();
 * // The broker wraps language primitives, so it runs REAL — mocking the timers it patches would
 * // leave the test asserting against the mock rather than against node's own handles
 */

export const timersWatchBrokerProxy = (): Record<PropertyKey, never> => ({});
