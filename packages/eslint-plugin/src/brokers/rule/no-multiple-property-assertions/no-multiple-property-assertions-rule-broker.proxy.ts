import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';

/**
 * Proxy for no-multiple-property-assertions rule broker.
 * Provides mock setup for testing the rule.
 */
export const noMultiplePropertyAssertionsRuleBrokerProxy = (): {
  createContext: () => EslintContext;
} => ({
  createContext: (): EslintContext => ({
    filename: undefined,
    report: jest.fn(),
  }),
});
