import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';
import { isInsideGatewayLayerBrokerProxy } from './is-inside-gateway-layer-broker.proxy';
import { isTypePositionLayerBrokerProxy } from './is-type-position-layer-broker.proxy';
import { isObjectLiteralKeyLabelLayerBrokerProxy } from './is-object-literal-key-label-layer-broker.proxy';
import { propertyIdentifierToCheckLayerBrokerProxy } from './property-identifier-to-check-layer-broker.proxy';
import { resolvePackagePlatformLayerBrokerProxy } from './resolve-package-platform-layer-broker.proxy';
import { resolveGatewayScopeLayerBrokerProxy } from './resolve-gateway-scope-layer-broker.proxy';
import { isPageCallbackCallLayerBrokerProxy } from './is-page-callback-call-layer-broker.proxy';
import { isInsideInlinePageCallbackLayerBrokerProxy } from './is-inside-inline-page-callback-layer-broker.proxy';
import { enclosingFunctionBindingNamesLayerBrokerProxy } from './enclosing-function-binding-names-layer-broker.proxy';

/**
 * Proxy for platform-globals-ban rule broker. The rule's own test drives it through
 * typedRuleTesterHarness (real ESLint, real TypeScript program) rather than through this
 * proxy — every child construction below is real-passthrough by default, so it never runs.
 */
export const rulePlatformGlobalsBanBrokerProxy = (): {
  createContext: () => TSESLint.RuleContext<string, unknown[]>;
} => {
  isInsideGatewayLayerBrokerProxy();
  isTypePositionLayerBrokerProxy();
  isObjectLiteralKeyLabelLayerBrokerProxy();
  propertyIdentifierToCheckLayerBrokerProxy();
  resolvePackagePlatformLayerBrokerProxy();
  resolveGatewayScopeLayerBrokerProxy();
  isPageCallbackCallLayerBrokerProxy();
  isInsideInlinePageCallbackLayerBrokerProxy();
  enclosingFunctionBindingNamesLayerBrokerProxy();

  return {
    createContext: (): TSESLint.RuleContext<string, unknown[]> => RuleContextStub(),
  };
};
