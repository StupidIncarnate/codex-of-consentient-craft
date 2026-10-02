/**
 * PURPOSE: Proxy for the ban-ambient-module-resolve rule broker — present only to satisfy enforce-proxy-patterns. Tests for the rule itself use RuleTester directly.
 *
 * USAGE:
 * ruleBanAmbientModuleResolveBrokerProxy();
 *
 * WHEN-TO-USE: Companion artifact for enforce-proxy-patterns / enforce-proxy-child-creation. Not consumed by application code.
 */
export const ruleBanAmbientModuleResolveBrokerProxy = (): Record<PropertyKey, never> => ({});
