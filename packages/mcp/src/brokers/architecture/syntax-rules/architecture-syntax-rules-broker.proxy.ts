/**
 * PURPOSE: Empty proxy for architectureSyntaxRulesBroker, which returns a fixed redirect string and
 * so has no dependency to mock.
 *
 * USAGE:
 * architectureSyntaxRulesBrokerProxy();
 * // Returns {} — nothing to set up
 */
export const architectureSyntaxRulesBrokerProxy = (): Record<PropertyKey, never> => ({});
