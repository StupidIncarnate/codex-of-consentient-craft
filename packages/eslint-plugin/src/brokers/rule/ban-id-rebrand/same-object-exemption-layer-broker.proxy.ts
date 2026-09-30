/**
 * Proxy for sameObjectExemptionLayerBroker. It reads AST nodes and stages no mock, so its test
 * parses real code.
 */
export const sameObjectExemptionLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
