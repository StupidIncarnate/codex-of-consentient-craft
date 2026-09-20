/**
 * PURPOSE: Proxy for the ban-locator-pick rule broker — present only to satisfy enforce-proxy-patterns. Tests for the rule itself use RuleTester directly.
 *
 * USAGE:
 * ruleBanLocatorPickBrokerProxy();
 *
 * WHEN-TO-USE: Companion artifact for enforce-proxy-patterns / enforce-proxy-child-creation. Not consumed by application code.
 */
export const ruleBanLocatorPickBrokerProxy = (): Record<PropertyKey, never> => ({});
