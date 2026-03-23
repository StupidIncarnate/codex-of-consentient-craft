import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';

/**
 * Proxy for ban-inline-helpers-in-test-scenarios rule broker.
 * Provides mock setup for testing the rule.
 */
export const ruleBanInlineHelpersInTestScenariosBrokerProxy = (): {
  createContext: () => EslintContext;
} => ({
  createContext: (): EslintContext => ({
    filename: undefined,
    report: jest.fn(),
  }),
});
