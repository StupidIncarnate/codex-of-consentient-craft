/**
 * PURPOSE: Proxy for the no-hardcoded-package-names rule broker — present only to satisfy enforce-proxy-patterns. Tests for the rule itself use RuleTester directly.
 *
 * USAGE:
 * ruleNoHardcodedPackageNamesBrokerProxy();
 *
 * WHEN-TO-USE: Companion artifact for enforce-proxy-patterns / enforce-proxy-child-creation. Not consumed by application code.
 */
export const ruleNoHardcodedPackageNamesBrokerProxy = (): Record<PropertyKey, never> => ({});
