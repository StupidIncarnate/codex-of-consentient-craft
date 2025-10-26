/**
 * Proxy for enforce-magic-arrays rule broker.
 * Rule brokers use ESLint RuleTester integration tests, not traditional Jest unit tests.
 * This proxy exists for project structure consistency but is not actively used in tests.
 */
export const ruleEnforceMagicArraysBrokerProxy = (): Record<PropertyKey, never> => ({});
