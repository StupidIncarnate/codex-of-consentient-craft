import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';

/**
 * Proxy for no-mutable-state-in-proxy-factory rule broker.
 * Provides mock setup for testing the rule.
 */
export const noMutableStateInProxyFactoryRuleBrokerProxy = (): {
  createContext: () => EslintContext;
} => ({
  createContext: (): EslintContext => ({
    filename: undefined,
    report: jest.fn(),
  }),
});
