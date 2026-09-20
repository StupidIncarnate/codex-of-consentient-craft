/**
 * PURPOSE: Empty proxy for `opRemoveApplyLayerBroker`. Its I/O is INJECTED through the ingredient's
 * own `config.routes.remove` function — a test supplies a real function over an in-memory target,
 * never a mock, so there is no boundary here for `registerMock` to address.
 *
 * USAGE:
 * opRemoveApplyLayerBrokerProxy();
 */
export const opRemoveApplyLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
