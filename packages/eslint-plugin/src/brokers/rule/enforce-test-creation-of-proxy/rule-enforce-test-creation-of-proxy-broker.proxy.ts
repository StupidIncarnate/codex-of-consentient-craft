import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';

/**
 * Proxy for enforce-test-creation-of-proxy rule broker.
 * Provides mock setup for testing the rule.
 */
export const ruleEnforceTestCreationOfProxyBrokerProxy = (): {
  createContext: () => EslintContext;
} => ({
  createContext: (): EslintContext => ({
    filename: undefined,
    report: jest.fn(),
  }),
});
