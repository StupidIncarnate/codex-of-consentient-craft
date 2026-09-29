import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';
import { voidSinkSpyLayerBrokerProxy } from './void-sink-spy-layer-broker.proxy';
import { typedSpyMethodTakesNoArgsLayerBrokerProxy } from './typed-spy-method-takes-no-args-layer-broker.proxy';

/**
 * Proxy for the ban-proxy-empty-called-with rule broker. The rule's own test drives it through
 * typedRuleTesterHarness (real ESLint, real TypeScript program) rather than through this
 * proxy.
 */
export const ruleBanProxyEmptyCalledWithBrokerProxy = (): {
  createContext: () => TSESLint.RuleContext<string, unknown[]>;
} => {
  voidSinkSpyLayerBrokerProxy();
  typedSpyMethodTakesNoArgsLayerBrokerProxy();

  return {
    createContext: (): TSESLint.RuleContext<string, unknown[]> => RuleContextStub(),
  };
};
