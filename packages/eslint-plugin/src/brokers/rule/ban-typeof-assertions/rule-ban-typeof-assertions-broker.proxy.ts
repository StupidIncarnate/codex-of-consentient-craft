/**
 * PURPOSE: Proxy for ban-typeof-assertions rule broker
 *
 * USAGE:
 * ruleBanTypeofAssertionsBrokerProxy();
 *
 * WHEN-TO-USE: Empty proxy - ESLint rules run with real parsing to validate DSL logic.
 */
export const ruleBanTypeofAssertionsBrokerProxy = (): Record<PropertyKey, never> => ({});
