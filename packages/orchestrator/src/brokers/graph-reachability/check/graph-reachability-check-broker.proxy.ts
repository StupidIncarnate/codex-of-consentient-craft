/**
 * PURPOSE: Empty proxy for graphReachabilityCheckBroker — it reads only statics and runs a pure
 * transformer, with no adapter or I/O boundary to mock.
 *
 * USAGE:
 * graphReachabilityCheckBrokerProxy();
 */
export const graphReachabilityCheckBrokerProxy = (): Record<PropertyKey, never> => ({});
