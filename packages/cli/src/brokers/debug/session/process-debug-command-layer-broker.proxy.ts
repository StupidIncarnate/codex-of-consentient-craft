/**
 * PURPOSE: Proxy for process-debug-command-layer-broker tests
 *
 * USAGE:
 * const proxy = processDebugCommandLayerBrokerProxy();
 * // No mocks needed - uses real transformers and statics
 */

export const processDebugCommandLayerBrokerProxy = (): Record<PropertyKey, never> =>
  // No dependencies to mock - transformer and statics run real
  ({});
