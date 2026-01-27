export const validateNoExposedChildProxiesLayerBrokerProxy = (): Record<PropertyKey, never> =>
  // This is a pure layer function with no external dependencies
  // It only validates AST nodes, so no mocking needed
  ({});
