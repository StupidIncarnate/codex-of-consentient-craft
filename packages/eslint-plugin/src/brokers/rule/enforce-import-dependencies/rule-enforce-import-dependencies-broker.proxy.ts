import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';
import { validateExternalImportLayerBrokerProxy } from './validate-external-import-layer-broker.proxy';

/**
 * Proxy for enforce-import-dependencies rule broker.
 * Provides mock setup for testing the rule.
 */
export const ruleEnforceImportDependenciesBrokerProxy = (): {
  createContext: () => TSESLint.RuleContext<string, unknown[]>;
} => {
  validateExternalImportLayerBrokerProxy();

  return {
    createContext: (): TSESLint.RuleContext<string, unknown[]> => RuleContextStub(),
  };
};
