import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';

/**
 * Proxy for enforce-import-dependencies rule broker.
 * Provides mock setup for testing the rule.
 */
export const enforceImportDependenciesRuleBrokerProxy = (): {
  createContext: () => EslintContext;
} => ({
  createContext: (): EslintContext => ({
    filename: undefined,
    report: jest.fn(),
  }),
});
