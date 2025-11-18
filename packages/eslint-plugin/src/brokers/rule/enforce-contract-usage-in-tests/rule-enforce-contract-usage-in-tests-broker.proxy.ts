import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';

/**
 * Proxy for enforce-contract-usage-in-tests rule broker.
 * Provides mock setup for testing the rule.
 */
export const ruleEnforceContractUsageInTestsBrokerProxy = (): {
  createContext: () => EslintContext;
} => ({
  createContext: (): EslintContext => ({
    filename: undefined,
    report: jest.fn(),
  }),
});
