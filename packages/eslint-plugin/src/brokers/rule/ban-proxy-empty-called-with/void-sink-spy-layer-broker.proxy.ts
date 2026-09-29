/**
 * Proxy for voidSinkSpyLayerBroker. It reads AST nodes and stages no mock, so its test runs real
 * ESLint over real code.
 */
export const voidSinkSpyLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
