/**
 * PURPOSE: Empty proxy for `opAttachApplyLayerBroker`. Its I/O is INJECTED through the ingredient's
 * own `config.routes.query` function — a test supplies a real function over an in-memory target,
 * never a mock, so there is no boundary here for `registerMock` to address.
 *
 * USAGE:
 * opAttachApplyLayerBrokerProxy();
 */
export const opAttachApplyLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
