import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';
import { validateHarnessConstructorSideEffectsLayerBrokerProxy } from './validate-harness-constructor-side-effects-layer-broker.proxy';

/**
 * Proxy for enforce-harness-patterns rule broker.
 * Provides mock setup for testing the rule.
 */
export const ruleEnforceHarnessPatternsBrokerProxy = (): {
  createContext: () => TSESLint.RuleContext<string, unknown[]>;
} => {
  validateHarnessConstructorSideEffectsLayerBrokerProxy();

  return {
    createContext: (): TSESLint.RuleContext<string, unknown[]> => RuleContextStub(),
  };
};
