import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';

/**
 * Proxy for require-contract-validation rule broker.
 * Provides mock setup for testing the rule.
 */
export const requireContractValidationRuleBrokerProxy = (): {
  createContext: () => EslintContext;
} => ({
  createContext: (): EslintContext => ({
    filename: undefined,
    report: jest.fn(),
  }),
});
