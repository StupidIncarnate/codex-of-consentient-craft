/**
 * PURPOSE: Proxy for findModuleConstInitLayerBroker
 *
 * USAGE:
 * findModuleConstInitLayerBrokerProxy();
 *
 * WHEN-TO-USE: Empty proxy - the layer is a pure AST walk with no I/O boundary to mock.
 */
export const findModuleConstInitLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
