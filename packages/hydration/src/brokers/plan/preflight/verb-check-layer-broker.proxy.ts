/**
 * PURPOSE: Empty proxy for `verbCheckLayerBroker`. It reads only its own arguments — a plan, a
 * config map — and throws a plain domain error; there is no I/O boundary here for `registerMock`
 * to address.
 *
 * USAGE:
 * verbCheckLayerBrokerProxy();
 */
export const verbCheckLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
