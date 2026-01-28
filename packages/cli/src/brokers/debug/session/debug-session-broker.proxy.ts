/**
 * PURPOSE: Proxy for debug-session-broker tests
 *
 * USAGE:
 * const proxy = debugSessionBrokerProxy();
 * // No mocks needed - pure initialization
 */

export const debugSessionBrokerProxy = (): Record<PropertyKey, never> =>
  // No dependencies to mock - pure state initialization
  ({});
