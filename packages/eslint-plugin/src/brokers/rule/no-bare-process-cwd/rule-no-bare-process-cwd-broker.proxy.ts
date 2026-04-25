import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import { minimatchMatchAdapterProxy } from '../../../adapters/minimatch/match/minimatch-match-adapter.proxy';

/**
 * Proxy for no-bare-process-cwd rule broker.
 * Provides mock setup for testing the rule.
 */
export const ruleNoBareProcessCwdBrokerProxy = (): {
  createContext: () => EslintContext;
} => {
  minimatchMatchAdapterProxy();

  return {
    createContext: (): EslintContext => ({
      filename: undefined,
      report: jest.fn(),
    }),
  };
};
