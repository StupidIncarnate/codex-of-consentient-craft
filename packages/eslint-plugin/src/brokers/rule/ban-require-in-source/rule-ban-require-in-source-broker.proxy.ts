/**
 * PURPOSE: Proxy for ban-require-in-source rule broker
 *
 * USAGE:
 * ruleBanRequireInSourceBrokerProxy();
 *
 * WHEN-TO-USE: Empty proxy - ESLint rules run with real parsing to validate DSL logic.
 */
export const ruleBanRequireInSourceBrokerProxy = (): Record<PropertyKey, never> => ({});
