/**
 * PURPOSE: Empty proxy for runtimeDefaultLayerBroker — it loads a real installed package with
 * Node's own `require`, whose reads sit inside node_modules and run real.
 *
 * USAGE:
 * runtimeDefaultLayerBrokerProxy();
 * // No setup methods
 */

export const runtimeDefaultLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
