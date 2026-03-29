/**
 * PURPOSE: Proxy for ban-not-to-throw rule broker
 *
 * USAGE:
 * ruleBanNotToThrowBrokerProxy();
 *
 * WHEN-TO-USE: Empty proxy - ESLint rules run with real parsing to validate DSL logic.
 */
export const ruleBanNotToThrowBrokerProxy = (): Record<PropertyKey, never> => ({});
