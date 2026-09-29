import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';
import { isTypeNameReferencedLayerBrokerProxy } from './is-type-name-referenced-layer-broker.proxy';
import { checkAnyLeakReturnLayerBrokerProxy } from './check-any-leak-return-layer-broker.proxy';
import { isJsonParseOrDynamicImportCallLayerBrokerProxy } from './is-json-parse-or-dynamic-import-call-layer-broker.proxy';

/**
 * Proxy for gateway-return-unknown-not-caller-type rule broker. The rule's own test drives it
 * through typedRuleTesterHarness (real ESLint, real TypeScript program) rather than through
 * this proxy — every child construction below is real-passthrough by default, so it never runs.
 */
export const ruleGatewayReturnUnknownNotCallerTypeBrokerProxy = (): {
  createContext: () => TSESLint.RuleContext<string, unknown[]>;
} => {
  isTypeNameReferencedLayerBrokerProxy();
  checkAnyLeakReturnLayerBrokerProxy();
  isJsonParseOrDynamicImportCallLayerBrokerProxy();

  return {
    createContext: (): TSESLint.RuleContext<string, unknown[]> => RuleContextStub(),
  };
};
