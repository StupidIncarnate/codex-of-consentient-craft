import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';

/**
 * Proxy for enforce-test-colocation rule broker.
 * Provides mock setup for testing the rule.
 */
export const ruleEnforceTestColocationBrokerProxy = (): {
  createContext: () => EslintContext;
  fsExistsSync: ReturnType<typeof fsExistsSyncAdapterProxy>;
} => {
  const fsExistsSync = fsExistsSyncAdapterProxy();

  return {
    createContext: (): EslintContext => ({
      filename: undefined,
      report: jest.fn(),
    }),
    fsExistsSync,
  };
};
