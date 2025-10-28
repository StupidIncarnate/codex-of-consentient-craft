import { validateReturnStatementLayerBrokerProxy } from './validate-return-statement-layer-broker.proxy';
import { validateObjectExpressionLayerBrokerProxy } from './validate-object-expression-layer-broker.proxy';

export const validateProxyFunctionReturnLayerBrokerProxy = (): Record<PropertyKey, never> => {
  // This is a pure layer function with no external dependencies
  // It only validates AST nodes, so no mocking needed
  validateReturnStatementLayerBrokerProxy();
  validateObjectExpressionLayerBrokerProxy();

  return {};
};
