/**
 * PURPOSE: Proxy for the ban-self-located-repo-lookup rule broker — present only to satisfy enforce-proxy-patterns. Tests for the rule itself use RuleTester directly.
 *
 * USAGE:
 * ruleBanSelfLocatedRepoLookupBrokerProxy();
 *
 * WHEN-TO-USE: Companion artifact for enforce-proxy-patterns / enforce-proxy-child-creation. Not consumed by application code.
 */
export const ruleBanSelfLocatedRepoLookupBrokerProxy = (): Record<PropertyKey, never> => ({});
