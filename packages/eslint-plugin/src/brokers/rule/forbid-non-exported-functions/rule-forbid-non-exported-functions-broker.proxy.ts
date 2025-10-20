import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';

/**
 * Proxy for forbid-non-exported-functions rule broker.
 * Provides mock setup for testing the rule.
 */
export const ruleForbidNonExportedFunctionsBrokerProxy = (): {
  createContext: () => EslintContext;
} => ({
  createContext: (): EslintContext => ({
    filename: undefined,
    report: jest.fn(),
  }),
});
