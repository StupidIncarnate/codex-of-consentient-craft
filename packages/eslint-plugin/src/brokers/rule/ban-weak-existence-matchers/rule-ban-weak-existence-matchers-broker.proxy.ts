/**
 * PURPOSE: Proxy for ban-weak-existence-matchers rule broker
 *
 * USAGE:
 * ruleBanWeakExistenceMatchersBrokerProxy();
 *
 * WHEN-TO-USE: Empty proxy - ESLint rules run with real parsing to validate DSL logic.
 */
export const ruleBanWeakExistenceMatchersBrokerProxy = (): Record<PropertyKey, never> => ({});
