import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';
import { checkPrimitiveViolationLayerBrokerProxy } from './check-primitive-violation-layer-broker.proxy';

/**
 * Proxy for ban-primitives rule broker.
 * Provides mock setup for testing the rule.
 */
export const ruleBanPrimitivesBrokerProxy = (): {
  createContext: () => TSESLint.RuleContext<string, unknown[]>;
} => {
  checkPrimitiveViolationLayerBrokerProxy();

  return {
    createContext: (): TSESLint.RuleContext<string, unknown[]> => RuleContextStub(),
  };
};
