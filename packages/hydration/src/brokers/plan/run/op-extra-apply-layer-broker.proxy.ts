/**
 * PURPOSE: Empty proxy for `opExtraApplyLayerBroker`. Its I/O is INJECTED through the ingredient's
 * own `config.extras[verb].apply` function — a test supplies a real function over an in-memory
 * target, never a mock, so there is no boundary here for `registerMock` to address.
 *
 * USAGE:
 * opExtraApplyLayerBrokerProxy();
 */
export const opExtraApplyLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
