/**
 * PURPOSE: Proxy for the enforce-quest-cwd-resolve rule broker — present only to satisfy enforce-proxy-patterns. Tests for the rule itself use RuleTester directly.
 *
 * USAGE:
 * ruleEnforceQuestCwdResolveBrokerProxy();
 *
 * WHEN-TO-USE: Companion artifact for enforce-proxy-patterns / enforce-proxy-child-creation. Not consumed by application code.
 */
export const ruleEnforceQuestCwdResolveBrokerProxy = (): Record<PropertyKey, never> => ({});
