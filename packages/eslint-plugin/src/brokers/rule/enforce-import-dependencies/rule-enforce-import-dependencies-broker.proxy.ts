import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import { validateExternalImportLayerBrokerProxy } from './validate-external-import-layer-broker.proxy';

/**
 * Proxy for enforce-import-dependencies rule broker.
 * Provides mock setup for testing the rule.
 */
export const ruleEnforceImportDependenciesBrokerProxy = (): {
  createContext: () => EslintContext;
} => {
  validateExternalImportLayerBrokerProxy();

  return {
    createContext: (): EslintContext => ({
      filename: undefined,
      report: jest.fn(),
    }),
  };
};
