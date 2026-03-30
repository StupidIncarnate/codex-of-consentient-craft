/**
 * PURPOSE: Proxy for ban-negated-matchers rule broker
 *
 * USAGE:
 * ruleBanNegatedMatchersBrokerProxy();
 *
 * WHEN-TO-USE: Empty proxy - ESLint rules run with real parsing to validate DSL logic.
 */
export const ruleBanNegatedMatchersBrokerProxy = (): Record<PropertyKey, never> => ({});
