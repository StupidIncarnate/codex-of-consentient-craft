import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';

/**
 * Proxy for enforce-stub-patterns rule broker.
 * Provides mock setup for testing the rule.
 */
export const enforceStubPatternsRuleBrokerProxy = (): {
  createContext: () => EslintContext;
} => ({
  createContext: (): EslintContext => ({
    filename: undefined,
    report: jest.fn(),
  }),
});
