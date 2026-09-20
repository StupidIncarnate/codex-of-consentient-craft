/**
 * PURPOSE: Empty proxy for `opSetApplyLayerBroker`. Its I/O is INJECTED through the ingredient's own
 * `config.transitions.reach` function — a test supplies a real function over an in-memory record,
 * never a mock, so there is no boundary here for `registerMock` to address.
 *
 * USAGE:
 * opSetApplyLayerBrokerProxy();
 */
export const opSetApplyLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
