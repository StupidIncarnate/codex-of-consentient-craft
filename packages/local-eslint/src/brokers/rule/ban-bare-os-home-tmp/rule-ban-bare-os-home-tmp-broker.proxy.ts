/**
 * PURPOSE: Proxy for the ban-bare-os-home-tmp rule broker — present only to satisfy
 * enforce-proxy-patterns. Tests for the rule itself use RuleTester directly.
 *
 * USAGE:
 * ruleBanBareOsHomeTmpBrokerProxy();
 *
 * WHEN-TO-USE: Companion artifact for enforce-proxy-patterns / enforce-proxy-child-creation. Not consumed by application code.
 */
export const ruleBanBareOsHomeTmpBrokerProxy = (): Record<PropertyKey, never> => ({});
