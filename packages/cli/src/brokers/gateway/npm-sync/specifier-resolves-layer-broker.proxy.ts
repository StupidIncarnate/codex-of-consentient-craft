/**
 * PURPOSE: Empty proxy for specifierResolvesLayerBroker — it asks the real TypeScript resolver about
 * real installed packages.
 *
 * USAGE:
 * specifierResolvesLayerBrokerProxy();
 * // No setup methods
 */

export const specifierResolvesLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
