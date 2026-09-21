/**
 * PURPOSE: Proxy for the graph-reachability rule broker — present only to satisfy enforce-proxy-patterns. Tests for the rule itself use RuleTester directly.
 *
 * USAGE:
 * ruleGraphReachabilityBrokerProxy();
 *
 * WHEN-TO-USE: Companion artifact for enforce-proxy-patterns / enforce-proxy-child-creation. Not consumed by application code.
 */
export const ruleGraphReachabilityBrokerProxy = (): Record<PropertyKey, never> => ({});
