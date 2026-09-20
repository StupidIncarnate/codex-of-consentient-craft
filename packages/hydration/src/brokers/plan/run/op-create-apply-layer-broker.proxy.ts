/**
 * PURPOSE: Empty proxy for `opCreateApplyLayerBroker`. Its I/O is INJECTED through the ingredient's
 * own `config.routes` function — a test supplies a real function over an in-memory target, never a
 * mock, so there is no boundary here for `registerMock` to address.
 *
 * USAGE:
 * opCreateApplyLayerBrokerProxy();
 */
export const opCreateApplyLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
