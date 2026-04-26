import { checkBindingInitializerLayerBrokerProxy } from './check-binding-initializer-layer-broker.proxy';
import { checkIsValidatedExpressionLayerBrokerProxy } from './check-is-validated-expression-layer-broker.proxy';
import { checkIsJsonParseCallLayerBrokerProxy } from './check-is-json-parse-call-layer-broker.proxy';

export const ruleRequireValidationOnUntypedPropertyAccessBrokerProxy = (): Record<
  PropertyKey,
  never
> => {
  checkBindingInitializerLayerBrokerProxy();
  checkIsValidatedExpressionLayerBrokerProxy();
  checkIsJsonParseCallLayerBrokerProxy();
  return {};
};
