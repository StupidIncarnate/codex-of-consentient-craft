import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';

/**
 * Proxy for no-bare-process-cwd rule broker.
 * Provides mock setup for testing the rule.
 */
export const ruleNoBareProcessCwdBrokerProxy = (): {
  createContext: () => EslintContext;
} => ({
  createContext: (): EslintContext => ({
    filename: undefined,
    report: jest.fn(),
  }),
});
