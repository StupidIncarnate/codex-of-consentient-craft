import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';

/**
 * Proxy for ban-contract-in-tests rule broker.
 * Provides mock setup for testing the rule.
 */
export const banContractInTestsRuleBrokerProxy = (): {
  createContext: () => EslintContext;
} => ({
  createContext: (): EslintContext => ({
    filename: undefined,
    report: jest.fn(),
  }),
});
