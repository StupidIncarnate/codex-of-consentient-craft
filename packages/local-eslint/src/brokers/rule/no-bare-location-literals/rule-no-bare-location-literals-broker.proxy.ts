/**
 * PURPOSE: Proxy for the no-bare-location-literals rule broker — present only to satisfy enforce-proxy-patterns. Tests for the rule itself use RuleTester directly.
 *
 * USAGE:
 * ruleNoBareLocationLiteralsBrokerProxy();
 *
 * WHEN-TO-USE: Companion artifact for enforce-proxy-patterns / enforce-proxy-child-creation. Not consumed by application code.
 */
export const ruleNoBareLocationLiteralsBrokerProxy = (): Record<PropertyKey, never> => ({});
