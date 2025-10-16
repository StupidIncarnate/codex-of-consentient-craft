import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';

/**
 * Proxy for ban-primitives rule broker.
 * Provides mock setup for testing the rule.
 */
export const banPrimitivesRuleBrokerProxy = (): {
  createContext: () => EslintContext;
} => ({
  createContext: (): EslintContext => ({
    filename: undefined,
    report: jest.fn(),
  }),
});
