import { findEnclosingFunctionLayerBrokerProxy } from './find-enclosing-function-layer-broker.proxy';
import { isJsonParseOrDynamicImportCallLayerBrokerProxy } from './is-json-parse-or-dynamic-import-call-layer-broker.proxy';

// Both children are pure AST walks with nothing to mock — called only to satisfy
// enforce-proxy-child-creation.
export const checkAnyLeakReturnLayerBrokerProxy = (): Record<PropertyKey, never> => {
  findEnclosingFunctionLayerBrokerProxy();
  isJsonParseOrDynamicImportCallLayerBrokerProxy();

  return {};
};
